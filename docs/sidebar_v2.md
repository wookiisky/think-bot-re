## Sidebar 开发方案

本设计方案以 Chrome 扩展 Sidebar 为核心，旨在为重构或新开发提供一份清晰、全面且可执行的技术蓝图。方案强调**数据整体压缩存储**、**清晰的消息协议 (CQRS)**、**分层的 React 状态管理**与**严格的运行时约束**，并严格遵循 `desc.md` 中定义的用户界面与交互流程。

### 1. 核心设计原则

-   **后台中心化 (Background-Centric)**: 所有核心业务逻辑、数据持久化与外部 API 通信均在 Service Worker (Background) 中完成。UI 层（Sidebar）作为无状态的渲染终端，仅负责展示数据和发送用户意图（命令）。
-   **命令/事件分离 (CQRS)**: UI 通过**命令 (Commands)** 请求后台执行操作（如发送消息、提取内容）。后台完成操作后，通过**事件 (Events)** 通知所有 UI 实例数据已变更。UI 监听事件并重新拉取最新数据，确保数据流的单向与可预测性。
-   **最终一致性与乐观更新**:
    -   **最终一致性**: 数据的唯一“真实来源”(Source of Truth) 是 `chrome.storage`。UI 通过监听 `onDataChanged` 事件来拉取最新快照，与持久化层保持最终一致。
    -   **乐观更新**: 对于 LLM 流式响应等高频交互，UI 会在内存中直接应用 `onStreamChunk` 事件带来的增量更新（打字机效果），以实现最佳用户体验。流结束后，再通过 `onDataChanged` 事件与持久化后的最终数据对齐。
-   **模块化与 SOLID**: 所有模块（服务、存储、API 客户端）都应遵循单一职责、接口隔离等原则，确保高内聚、低耦合，易于测试和替换。

### 2. 运行时约束 (Chrome 环境)

-   **Service Worker 生命周期**: Background 脚本可被浏览器随时休眠。所有长任务必须设计为可中断和可恢复的。消息处理必须是幂等的，以应对事件的重复派发。
-   **受限页面与权限**: 内容脚本无法注入 `chrome://`、`edge://` 或应用商店等内部页面。在这些页面打开 Sidebar 时，应提供明确提示并引导用户至独立的会話页面。
-   **通信协议**: 所有跨上下文（Sidebar ↔ Background）通信必须通过定义良好的桥接层，消息必须是类型化的、可序列化的，并采用统一的信封结构。
-   **存储限制**: `chrome.storage.local` 有容量和写入频率限制。必须采用数据压缩、批量写入和写入去抖等策略，最小化存储压力。
-   **标签页行为**:
    -   **切换标签页**: 用户切换到其他浏览器标签页时，自动关闭 Sidebar。
    -   **同页导航**: 在已打开 Sidebar 的标签页内发生 URL 变化时，Sidebar 保持打开状态。待新页面加载完成后，自动触发新页面的内容提取和数据同步流程。

-   **MV3 Service Worker 空闲与唤醒**:
    -   Service Worker 可能在空闲约 30 秒后被回收。所有长任务需可中断/恢复，命令处理应幂等（结合 `correlationId`）。
    -   LLM 流式任务通过“状态映射 + 最终持久化 + 事件重放”实现恢复（详见 6.3）。

-   **消息大小与频率限制**:
    -   事件仅作“提示”，数据由 UI 主动拉取（`OnDataChangedEvt` 不携带 `PageData`）。
    -   流式响应拆分为小块（`OnStreamChunkEvt`），UI 基于 `index` 去重排序，避免总线拥塞。

-   **权限与剪贴板**:
    -   复制提取内容在 Sidebar（window 环境）通过 `navigator.clipboard` 执行。
    -   避免在 BG 使用剪贴板；无需 Offscreen Document。

-   **端点与窗口通信**:
    -   端点选择：BG 用 `webext-bridge/background`；内容脚本用 `webext-bridge/content-script`；扩展页面（Sidebar/Options/Conversations）用 `webext-bridge/window`。
    -   统一端点可避免 “Communication with window has not been allowed” 等错误。

-   **React 严格模式（开发态）**:
    -   副作用可能执行两次；桥接监听/订阅需幂等注册与清理。
    -   Store 初始化与订阅逻辑可重复进入，避免重复事件处理。

---

### 3. 数据与存储

#### 3.1. 数据结构 (持久化)

核心数据模型以页面为单位进行组织，整体压缩后存入 `chrome.storage`。

```ts
// 提取服务提供商
export type ExtractionProvider = 'readability' | 'jina';

// 提取结果
export interface ExtractionResult {
	provider: ExtractionProvider;
	contentText: string;          // 纯文本内容 (若体积较大，持久化时压缩)
	contentMarkdown?: string;     // (可选) Markdown 格式
	meta: { title?: string; byline?: string; lang?: string };
	createdAt: string;            // ISO 8601 日期字符串
	contentHash?: string;         // contentText 的哈希值，用于幂等写入
}

// 用户消息
export interface UserMessage {
	id: string;                   // 唯一ID
	displayContent: string;       // 在UI中显示的内容 (例如，快捷指令的显示文本)
	actualContent: string;        // 实际发送给 LLM 的内容 (例如，快捷指令的真实 Prompt)
	isQuickInput?: boolean;       // 标识是否来自快捷指令
	quickInputId?: string;        // 若来自快捷指令，记录其ID
	image?: string;               // 粘贴图片的 Base64 或 URL
	createdAt: number;            // 时间戳
}

// 模型回复分支
export interface MessageBranch {
	branchId: string;             // 分支的唯一ID (UUID)
	modelId: string;              // 所用模型的ID
	status: 'idle' | 'loading' | 'completed' | 'error' | 'cancelled';
	content: string;              // 聚合后的完整回复内容 (仅在 status 为 'completed' 时持久化)
	errorRaw?: unknown;           // 原始错误对象，用于调试
	createdAt: string;            // ISO 8601
	updatedAt: string;            // ISO 8601
}

// 单轮对话 (包含用户提问和多个模型回复)
export interface ChatTurn {
	id: string;                   // 单轮对话的唯一ID (UUID)
	userMessage: UserMessage;
	responses: MessageBranch[];   // 支持同一问题有多个模型的回复分支
	createdAt: number;            // 时间戳
}

// 对话标签页 (对应一个快捷指令或默认的"聊天"Tab)
export interface ChatTab {
	id:string;                   // 唯一ID (对应 QuickInput.id 或 'chat')
	name: string;                 // 显示名称
	history: ChatTurn[];          // 对话历史
	hasConversation: boolean;     // 快捷判断是否存在对话
	status: 'idle' | 'loading' | 'error'; // 整个标签页的加载状态
	error?: string;               // 错误信息
}

// 页面总数据结构
export interface PageData {
	url: string;                  // 页面URL (主键)
	title: string;                // 页面标题
	favicon?: string;             // 页面图标
	extractedContent: ExtractionResult;
	tabs: Record<string, ChatTab>; // 键为 Tab ID
	lastModified: number;         // 最后修改时间戳，用于同步合并
	uiState: Partial<UIState>;    // 可持久化的部分UI状态 (如滚动位置)
	isDeleted?: boolean;          // 软删除标记
}
```

#### 3.2. UI 瞬时状态 (非持久化)

这些状态仅存在于 Sidebar 的内存中，随其关闭而销毁。

```ts
export interface SidebarUiState {
	activeQuickTabId: string;      // 当前激活的快捷指令Tab ID
	isIncludeExtraction: boolean;  // "附带页面内容" 开关状态
	inputDraft: string;            // 输入框草稿
	inputHeight: number;           // 输入框可变高度
	contentPanelHeight: number;    // 内容展示区可变高度
	imageDrafts: string[];         // 粘贴图片的预览 Data URL
	scrollAnchors: Record<string, number>; // 记录各消息的滚动锚点 (turnId -> scrollTop)
}
```

#### 3.3. 存储策略

-   **存储键**: `page:{hash(pageUrl)}`，避免超长 URL 作为键。
-   **压缩**: 当 `contentText` 或 `MessageBranch.content` 的文本长度超过阈值（如 1KB）时，使用 `pako` 等库进行压缩存储，并记录 `contentHash` 避免对相同内容重复写入。
-   **批量与去抖**: 对 `chrome.storage.local.set` 的调用进行合并与去抖（例如，通过 ~100ms 的时间窗口），在高频事件（如流式响应）下避免写放大。
-   **软删除**: 用户删除数据时，仅标记 `isDeleted: true` 并更新时间戳。通过云同步传播删除操作。后台服务定期清理已标记的陈旧数据。

---

### 4. 消息通信协议

采用统一的信封结构对所有跨上下文消息进行包装，实现跟踪、去重和标准化错误处理。

#### 4.1. 消息信封 (Envelope)

```ts
export interface MessageEnvelope<TPayload> {
	id: string;                 // 消息的唯一ID (UUID)
	correlationId?: string;     // 用于关联请求与响应/流的ID
	source: 'sidebar' | 'options' | 'conversations' | 'background';
	target: 'background' | 'broadcast';
	action: string;             // 动作名称, e.g., 'getPageData'
	payload: TPayload;
	meta?: { locale?: string; traceId?: string; pageUrl?: string; tabId?: number };
	version: 1;                 // 协议版本
}
```

-   **幂等性**: Background 对具有相同 `correlationId` 的命令，应直接返回缓存的或已处理的结果。

#### 4.2. 命令 (Commands: UI → Background)

UI 向 Background 发送的指令，应返回快速确认或轻量结果。

```ts
// 获取页面数据
export interface GetPageDataCmd { url: string }
// 触发内容提取
export interface TriggerExtractionCmd { url: string; provider: ExtractionProvider; force?: boolean; }
// 发送消息
export interface SendMessageCmd {
	pageUrl: string;
	tabId: string;
	displayContent: string;     // UI显示的内容
	actualContent: string;      // 实际发送的内容
	modelId: string;
	includeExtraction: boolean;
	images?: string[];
	isQuickInput?: boolean;
	quickInputId?: string;
}
// 停止消息生成
export interface StopMessageCmd { pageUrl: string; tabId: string; turnId: string; branchId?: string }
// 删除页面数据
export interface DeletePageDataCmd { url: string }
// 清空 Tab 对话历史
export interface ClearTabHistoryCmd { pageUrl: string; tabId: string }
// 导出 Tab 对话历史
export interface ExportTabHistoryCmd { pageUrl: string; tabId: string }
// 从用户消息创建新分支
export interface CreateBranchCmd { pageUrl: string; tabId: string; turnId: string; modelId: string }
// 编辑并重试用户消息
export interface EditMessageCmd { pageUrl: string; tabId: string; turnId: string; newContent: string }
// 重试用户消息
export interface RetryMessageCmd { pageUrl: string; tabId: string; turnId: string }
// 获取/保存配置
export interface GetSettingsCmd {}
export interface SaveSettingsCmd { settings: unknown }
// ... 其他命令
```

补充命令定义：

```ts
// 查询页面请求状态（恢复场景）
export interface GetPageStatusCmd { pageUrl: string }

// 删除单轮对话（含其所有分支）
export interface DeleteTurnCmd { pageUrl: string; tabId: string; turnId: string }

// 删除某个回复分支
export interface DeleteBranchCmd { pageUrl: string; tabId: string; turnId: string; branchId: string }

// 打开选项页 / 会话页（从 Sidebar 顶部入口）
export interface OpenOptionsPageCmd {}
export interface OpenConversationsPageCmd { selectPageUrl?: string }
```

#### 4.3. 事件 (Events: Background → UI)

Background 向所有 UI 广播的通知。

```ts
// 通用数据/配置变更事件
export interface OnDataChangedEvt { pageUrl: string }
export interface OnSettingsChangedEvt { /* ... */ }
export interface OnSyncStatusChangedEvt { status: 'syncing' | 'success' | 'error'; message?: string }

// 内容提取状态变更事件
export type ExtractionStage = 'idle' | 'requesting_html' | 'parsing' | 'persisting' | 'completed' | 'error';
export interface OnExtractionStatusChangedEvt {
	pageUrl: string;
	status: 'loading' | 'completed' | 'error';
	stage?: ExtractionStage; // 当前所处阶段
	error?: string;
}

// LLM 响应流事件
export interface MessageChunk {
	turnId: string;
	branchId: string;
	modelId: string;
	index: number;         // 单调递增的块索引，用于排序和去重
	deltaText?: string;     // 文本增量
	done?: boolean;         // 是否为最后一块
	error?: { code: string; message: string; raw?: unknown };
}
export type OnStreamChunkEvt = MessageChunk;
```

-   **轻量通知**: `OnDataChangedEvt` 仅通知 UI “数据已变，可以来拉取了”，而不直接携带庞大的 `PageData` 对象，以降低消息总线负载。

#### 4.4. 端点与握手

-   **端点选择**: Sidebar/Options/Conversations 使用 `webext-bridge/window`；BG 使用 `webext-bridge/background`；内容脚本使用 `webext-bridge/content-script`。
-   **内容脚本握手**: 内容脚本在就绪后发送 `contentReady` 通知（携带 `url`、`readyState`、时间戳）。BG 记录并准备后续提取。
-   **错误处理**: 对未注册的动作、窗口通信未授权等错误，统一以标准错误结构返回并在 UI 层提示。

---

### 5. 前端状态管理 (Zustand)

采用分层式的 Zustand Store 架构，隔离不同类型状态的权责。

#### 5.1. Store 架构

-   **`useSidebarSessionStore` (会话状态)**
    -   **职责**: 维护当前页面 `PageData` 的只读镜像，以及与数据加载相关的状态。
    -   **State**: `pageData: PageData | null`, `extractionStatus: 'loading' | ...`, `isPageDataLoading: boolean`
    -   **核心逻辑**:
        1.  **初始化**: 在 Sidebar 打开或 `pageUrl` 变化时，发送 `getPageData` 命令，并设置 `isPageDataLoading = true`。
        2.  **监听 `onDataChanged`**: 收到事件后，重新拉取完整的 `PageData`，确保与持久化层最终一致。
        3.  **监听 `onExtractionStatusChanged`**: 独立更新 `extractionStatus`，驱动 `ContentArea` 的 UI 变化。
        4.  **监听 `onStreamChunk` (乐观更新)**: 收到 `chunk` 后，**直接在内存中修改 `pageData` 镜像**。使用 `immer` 等工具，找到对应的 `MessageBranch` 并追加 `deltaText`。此过程不与 Background 通信，实现极速的打字机效果。
    -   **Selectors (选择器)**: 提供 `useActiveChatTab()`, `useBranchStatus(turnId, branchId)` 等派生状态，供组件消费。

-   **`useSidebarUiStore` (UI 瞬时状态)**
    -   **职责**: 管理所有非持久化的 UI 状态。
    -   **State**: `activeQuickTabId`, `inputDraft`, `panelHeights`, etc.
    -   **Actions**: 提供 `set...` 方法，供组件直接调用。

-   **`useSidebarActions` (动作封装)**
    -   **职责**: 作为所有“写操作”（向后台发送命令）的唯一出口。
    -   **实现**: 返回一个包含所有动作函数的对象 (`sendMessage`, `triggerExtraction`, ...)。函数内部封装了消息信封的创建、`webext-bridge` 调用和统一的错误处理。

#### 5.2. 组件层级拆解

-   **`ControlBar.tsx` (顶部控制栏)**
    -   **职责**: 页面级全局操作（提取方式切换、重新提取、复制、清除、打开其他页面）。
    -   **消费**: `extraction.provider`, `extractionStatus`。
    -   **调用**: `triggerExtraction()`, `deletePageData()`（二次确认）, `OpenOptionsPageCmd`, `OpenConversationsPageCmd`, 复制提取内容到剪贴板（UI 本地执行）。

-   **`ContentArea.tsx` (内容展示区)**
    -   **职责**: 显示提取的正文，处理加载/错误状态，响应高度拖拽。
    -   **消费**: `pageData.extraction`, `extractionStatus`, `uiState.contentPanelHeight`。
    -   **调用**: `setPanelHeight()`。

-   **`QuickTabs.tsx` (快捷指令区)**
    -   **职责**: 渲染所有 Tab（含“聊天”），处理切换，显示加载/数据状态条。
    -   **消费**: `config.quickInputs`, `pageData.tabs`, `uiState.activeQuickTabId`。
    -   **调用**: `setActiveQuickTab()`。
    -   **UI 规则**: 根据 `desc.md`，加载中显示绿橙渐变动态条，有数据时显示蓝色条；切换 Tab 时自动滚动到该 Tab 最后一条消息的“开始处”。

-   **`ChatArea.tsx` (聊天交互区)**
    -   **职责**: 渲染当前激活 Tab 的完整对话流，包括多分支消息、加载/错误状态及悬浮按钮。
    -   **消费**: `useActiveChatTab()` 选择器返回的 `activeTab` 数据。
    -   **调用**: `createMessageBranch()`, `sendMessage()` (用于重试/编辑)。
    -   **UI 规则**: 用户消息显示 `displayContent`，模型错误直接展示 `errorRaw` JSON，悬浮按钮组固定在右侧。加载态需展示“模型名称 + 圆圈 loading + 停止并删除当前消息按钮”。当存在分支时，悬浮按钮底部额外展示模型名称，消息以并排多列布局。构建对话历史时默认取每轮分支的第一个作为主线路渲染。
    -   **悬浮按钮组 (Hover Actions)**:
        -   **行为**: 鼠标悬停在消息上时显示，始终固定于视图右侧，其布局会根据消息高度自适应（从单行变为多行或竖排）。
        -   **用户消息按钮**: 包含编辑、重试、复制文本、复制 Markdown。分别调用 `editMessage()`, `retryMessage()` 等 `useSidebarActions` 中的动作。
        -   **模型回复按钮**: 包含跳转顶部、跳转底部、复制文本、复制 Markdown、创建分支、停止（仅进行中）、删除当前消息（调用 `DeleteTurnCmd` 或 `DeleteBranchCmd`）。创建分支将调用 `createMessageBranch()` 动作。

-   **`InputArea.tsx` (输入区域)**
    -   **职责**: 处理用户文本输入、图片粘贴预览与移除、模型选择和消息发送。**还包括“导出对话”和“停止并清空”等全局操作**。
    -   **消费**: `uiState.inputDraft`, `uiState.imageDrafts`, `config.models`, `activeTab.status` (用于禁用发送按钮)。
    -   **调用**: `sendMessage()`, `stopMessage()`（停止进行中的流）, `updateInputDraft()`, `updateImageDrafts()`, **`exportTabHistory()`**（导出规则见 6.5）, **`clearTabHistory()`**（二次确认）。模型选择器位于输入框右上角；“附带页面内容”开关默认开启。

---

### 5.3. 滚动与锚点

-   记录每条消息的滚动锚点（`SidebarUiState.scrollAnchors`），在切换 Tab 或恢复状态时滚动到“最后一条消息的开始处”。
-   “跳转顶部/底部”操作基于消息容器的位置锚点执行，避免因虚拟化导致的偏移。

---

### 6. 关键工作流程

#### 6.1. 内容提取流程

1.  **UI 触发**: Sidebar 打开，`useSidebarSessionStore` 发送 `getPageData(url)`。
2.  **BG 前置检查**:
    -   检查是否为受限页面，若是则返回错误。
    -   检查是否命中黑名单，若是则 UI 显示一个确认遮罩层，用户确认后才继续。
3.  **BG 请求 HTML**: 向内容脚本请求页面 HTML。
4.  **BG 执行提取**: 使用 Readability.js 或 Jina AI 服务进行提取，并通过 `onExtractionStatusChanged` 事件实时广播提取**阶段** (`requesting_html` -> `parsing` -> ...)。
5.  **BG 持久化**: 提取成功后，将结果写入 `chrome.storage`（按需压缩），然后广播 `onDataChanged` 事件。
6.  **UI 更新**: `useSidebarSessionStore` 监听到事件，拉取最新 `PageData` 并更新 UI。
7.  **(可选) BG 自动触发快捷指令**: 在持久化后，后台检查页面是否存在对话历史。若无，且当前激活的快捷指令被配置为“自动触发”，则后台直接为该指令组装并执行 `SendMessageCmd` 流程。

#### 6.2. 发送新消息流程 (流式)

1.  **UI 调用 Action**: 用户点击发送，`InputArea` 调用 `useSidebarActions` 中的 `sendMessage()`。
2.  **Action 组装命令**: `sendMessage` 组装 `SendMessageCmd` 命令（区分 `displayContent` 和 `actualContent`），通过 `webext-bridge` 发送。
3.  **BG 创建占位符**: Background 收到命令，**立即**在 `storage` 中创建一个新的 `ChatTurn` 和一个 `status: 'loading'` 的 `MessageBranch` 占位符。
4.  **BG 广播变更**: 持久化占位符后，广播 `onDataChanged`。
5.  **UI 显示加载态**: `useSidebarSessionStore` 监听到事件，拉取数据，`ChatArea` 渲染出一个加载中的消息框。
6.  **BG 开始流式请求**: Background 向 LLM API 发起请求，并将收到的数据块 (`chunk`) 通过 `onStreamChunk` 事件实时发送到前端。
7.  **UI 乐观更新**: `useSidebarSessionStore` 监听到 `onStreamChunk`，将 `deltaText` 实时追加到内存镜像中，`ChatArea` 呈现打字机效果。
8.  **BG 完成并持久化**: 流结束后，Background 将聚合后的完整 `content` 和 `status: 'completed'` 写入 `storage`。
9.  **BG 再次广播**: 再次广播 `onDataChanged` 事件。
10. **UI 最终对齐**: `useSidebarSessionStore` 拉取最终数据，内存镜像与持久化存储完全对齐，UI 渲染出最终消息。

    -   **变体**:
        -   若 `includeExtraction` 为真，BG 在组装 Prompt 时注入提取内容文本（或其摘要），并根据模型能力选择多模态/纯文本通道。
        -   若附带图片，BG 仅向支持多模态的模型发送；否则返回“模型不支持图片”的错误。

#### 6.3. LLM 请求状态恢复流程

当 LLM 请求进行中，用户切换到其他浏览器标签页导致 Sidebar 关闭再返回时，保证 UI 状态能够正确恢复。

1.  **BG 状态追踪**: Background 维护一个内存中的全局状态映射，记录进行中的 LLM 请求：`Map<pageUrl, { tabId: string; turnId: string; branchId: string; status: 'loading' }>`。
2.  **UI 初始化查询**: `useSidebarSessionStore` 在初始化时（`getPageData` 之后），会额外发送一个 `GetPageStatusCmd` 命令到后台。
3.  **BG 返回状态**: Background 查询全局状态映射，若发现当前 `pageUrl` 有正在进行的请求，则返回其状态信息。
4.  **UI 恢复加载态**: 如果收到加载中的状态，`useSidebarSessionStore` 会将此状态同步到其 `pageData` 镜像中。这会驱动 `ChatArea` 和 `QuickTabs` 自动渲染出与离开前一致的加载中界面（如 Tab 加载条、消息加载动画、禁用的输入框等）。
5.  **BG 请求完成**: 当后台的 LLM 请求最终完成时，它会正常地更新 `storage`、广播 `onDataChanged` 事件，并从全局状态映射中移除该条记录。后续的 UI 更新流程与标准流程无异。

#### 6.4. 停止与删除当前消息（单轮/分支）

1.  **UI 停止**: 用户点击“停止”或悬浮按钮中的停止，发送 `StopMessageCmd`（可选 `branchId`）。
2.  **BG 标记**: BG 更新对应分支状态为 `cancelled` 并持久化，广播 `onDataChanged`。
3.  **UI 删除**: 用户选择“删除当前消息”，发送 `DeleteTurnCmd`（删除整轮）或 `DeleteBranchCmd`（仅删除该分支）。BG 软删除并更新 `lastModified`，广播 `onDataChanged`。

#### 6.5. 导出对话（Markdown 格式）

-   触发 `exportTabHistory()` 后，前端根据当前 Tab 的 `history` 生成 Markdown：
    -   用户消息以引用块呈现：`> 用户：{displayContent}`。
    -   模型回复为正文，按分支顺序展现；多分支以二级标题或分隔标识模型名称：`## {modelId}`。
    -   代码块、列表等保持原样，图片以 Markdown 链接形式嵌入（若为 Data URL，建议提示体积）。

#### 6.6. 内容提取与复制

1.  **重新提取**: 切换 `provider` 或点击“重新提取”，调用 `triggerExtraction()`，UI 实时消费 `OnExtractionStatusChangedEvt` 的阶段更新。
2.  **复制提取内容**: UI 直接从 `pageData.extractedContent` 读取文本，写入剪贴板并提示成功/失败。

---

### 7. 可靠性、性能与安全

-   **可靠性**: 所有删除操作均需通过 mini-confirm 对话框二次确认。
-   **性能**:
    -   **虚拟化**: `ChatArea` 对于长对话历史应采用虚拟滚动，以保持渲染性能。
    -   **节流/防抖**: 对高频 UI 事件（拖拽、滚动、窗口尺寸变化）进行节流；对存储写入进行去抖和批量合并。
    -   **选择器稳定性**: 使用细粒度的 Zustand 选择器与 `shallow` 比较，避免不必要重渲染；把派生计算放入 Store。
    -   **渲染稳定性**: 组件 `key` 稳定；流式追加使用 `useLayoutEffect` 保证滚动定位时序；虚拟化下使用锚点避免跳动。
-   **安全**:
    -   **日志**: 日志仅记录在关键路径，使用英文，且绝不包含 API Key、完整 Prompt 或页面内容等敏感信息。
    -   **权限**: 申请最小化浏览器权限。
    -   **错误透明**: LLM 错误以原始 JSON 呈现于 UI，日志中仅记录最小必要上下文（无敏感信息）。

#### 7.4. 云同步策略 (简述)

为保证方案完整性，此处简述由 Background 负责的云同步核心策略，UI 层仅消费同步结果事件。

-   **基于时间戳合并 (Last Write Wins)**: 所有持久化数据（包括配置项和页面数据）都包含 `lastModified` 时间戳。同步时，通过比较本地与云端记录的时间戳，保留最新版本，实现可靠合并。
-   **软删除 (Soft Delete)**: 删除操作仅是在数据上添加 `isDeleted: true` 标记并更新时间戳。该“删除”作为一次更新通过同步机制传播到其他设备，确保删除操作不会丢失。后台服务会定期清理这些标记过时的数据。

### 8. 可测试性

-   **单元测试**: 针对纯函数、Zustand Store 的 Reducer/Action 逻辑、消息聚合器等进行测试。
-   **集成测试**: 测试 Sidebar ↔ Background 的完整消息通信、数据持久化与恢复流程。
-   **合约测试**: 为 `Commands` 和 `Events` 创建类型定义和示例载荷，确保前后端协议一致性。
-   **握手与端点测试**: 覆盖 `contentReady` 流程与端点导入正确性，避免“未注册处理器/窗口通信未授权”错误。
-   **恢复与开发态重渲染**: 在 StrictMode 下验证监听重复注册的幂等性与 UI 状态恢复。
