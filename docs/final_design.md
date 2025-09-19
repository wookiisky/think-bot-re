# Think Bot RE 最终技术设计方案

## 1. 概述

本文档综合了多个初步设计方案的优点，旨在为 Think Bot RE 浏览器扩展项目提供一份全面、健壮且可执行的最终技术蓝图。方案基于 Plasmo 框架，以需求文档 `docs/desc.md` 为唯一基准，确保功能完整实现，同时追求架构的优雅、可维护性和可扩展性。

## 2. 技术栈选型

为确保开发效率、用户体验和长期维护性，项目将采用以下技术栈：

-   核心框架: Plasmo - 提供浏览器扩展开发的完整生命周期管理。
-   UI 库: React + TypeScript - 保证组件化开发和类型安全。
-   样式：TailwindCSS + CSS Modules；图标使用本地 Material Icons 字体。
-   状态管理: Zustand - 轻量级全局状态管理，用于管理 UI 瞬时状态和从 `storage` 同步的配置快照。
-   数据持久化: `@plasmohq/storage` - Plasmo 官方封装，提供对 `chrome.storage.local` 的便捷访问，并结合其 `useStorage` Hook 实现响应式数据流。
-   组件间通信: `@plasmohq/messaging` - 用于所有跨模块（UI ↔ Background ↔ Content）的安全通信。
-   内容提取: `@mozilla/readability` - 核心的本地内容提取引擎。
-   Markdown 渲染: `react-markdown` - 在 React 组件中安全地渲染 Markdown 内容。
-   数据压缩: `pako` - 在数据存入 `chrome.storage` 前进行 Gzip 压缩，以节省空间。
-   表单处理: `react-hook-form` - 用于选项页面复杂的表单状态管理和校验。
-   拖拽排序: `@dnd-kit/core` - 用于选项页中列表的拖拽排序功能。
-   HTTP 请求: `ky` - 基于 Fetch API 的轻量级 HTTP 客户端，用于调用 Jina 及 LLM API。

### 2.1 大模型 (LLM) SDKs
- @google/generative-ai: Google Gemini 官方 SDK。
- openai: OpenAI 官方 SDK。
- @aws-sdk/client-bedrock-runtime: AWS Bedrock 官方 SDK。
- @azure/openai: Azure OpenAI 官方 SDK。

## 3. 整体架构

### 3.1 原则
1.  后台中心化 (Background-Centric):
项目采用以 后台服务 (Background Service Worker) 为中心的消息驱动架构。后台是所有业务逻辑、数据处理和外部 API 通信的唯一权威来源。UI 层（Sidebar, Options, Conversations）作为轻状态的视图，通过响应式数据绑定和消息传递与后台交互。

2.  Provider 模式:
对于存在多种实现的核心服务（内容提取、LLM调用、云同步），采用统一的 Provider 抽象接口和工厂模式进行管理。这使得添加新的服务提供商（如新的LLM）无需修改核心业务逻辑，只需实现接口并注册到工厂中。

### 3.2 架构

1.  UI 层 (顶层):
包含三个主要的用户界面：`Sidebar UI`、`Options UI` 和 `Conversations UI`。
这些 UI 组件通过 Plasmo 的 `useStorage` Hook 响应式地获取和展示数据，本身是轻状态的。

2.  通信层:
UI 层通过 `@plasmo/messaging` 库向后台服务发送消息。这是一个双向通信渠道，允许 UI 请求数据、触发操作，并接收后台的更新。

3.  核心层：后台服务 (Background Service):
`background.ts` 是整个扩展的“单一事实来源” (Single Source of Truth)，所有核心业务逻辑都在此处理。
它内部包含多个模块化服务：
    Message Router: 负责接收和分发来自 UI 的消息。
    LLM Service: 封装与大语言模型 (LLM) API 的所有交互。
    Storage Service: 管理所有对 `chrome.storage` 的读写操作。
    Extraction Service: 负责从网页提取内容。
    Sync Service: 处理云同步逻辑。
    Page State Store: 管理运行时的内存状态。
    Other Services: 其他辅助服务。

4.  外部交互层 (底层):
后台服务是唯一与外部进行通信的实体。
它通过向内容脚本 (Content Script) 发送请求来获取当前页面的 HTML 内容。
它直接调用外部 API，如 Jina AI API 和各种 LLM APIs。

## 4. 项目结构

我们将遵循 Plasmo 约定并结合模块化思想来组织项目文件：

```
.
├── assets/
│   └── icon.png
├── contents/
│   └── sidebar.tsx              # 侧边栏 UI 注入逻辑和根组件
├── tabs/
│   ├── conversations.tsx        # 会话历史页面
│   └── tutorial.tsx             # 教程页面
├── components/                  # 可复用的 React 组件 (MUI)
│   ├── ChatView.tsx
│   ├── Message.tsx
│   └── OtherComponents.tsx
├── hooks/                       # 可复用的 React Hooks
│   └── useConfirm.ts            # 统一的删除确认对话框 Hook
├── lib/                         # 后台核心逻辑和服务
│   ├── services/
│   │   ├── llm.ts               # LLM Service: 封装所有 LLM API 调用
│   │   ├── storage.ts           # Storage Service: 封装读写、压缩、软删除
│   │   ├── sync.ts              # Sync Service: 封装云同步逻辑
│   │   └── extractor.ts         # Extraction Service: 封装内容提取
│   ├── router.ts                # 后台消息路由器
│   └── state.ts                 # 内存状态管理器 (如进行中的请求)
├── store/                       # Zustand 状态管理 (用于 UI 状态)
│   └── ui.ts
├── types/                       # 全局 TypeScript 类型定义
│   └── index.ts
├── background.ts                # 后台服务入口
├── options.tsx                  # 选项页面
├── package.json
└── tsconfig.json
```

## 5. 数据模型 (Schema)

以下是存储在 `chrome.storage.local` 中的核心数据结构。所有大型字符串（`content`）和数组（`messages`）在存储前都应被压缩。

### useStorage 订阅与存储键策略
- 按 `thinkbot:<domain>:<resource>` 进行键命名，避免与其它扩展冲突并为数据迁移预留空间。
- UI 组件只通过 `useStorage` Hook 读取数据，写操作全部由 Background 的 `StorageService` 执行，保持单一事实来源。
- 大对象按页面或功能拆分到多个键，`useStorage` 仅监听相关片段，避免无关字段更新导致的级联渲染。
- 每个 `useStorage` 读取都提供初始状态（`undefined` 时展示 skeleton），并在挂载时触发一次后台同步，保证冷启动体验。

| 存储键 | 值类型 | 主要使用方 | 说明 |
| --- | --- | --- | --- |
| `thinkbot:config:v1` | `IConfig` | 选项页、Sidebar 初始化 | 包含所有配置，Sidebar 只读；更新通过消息写回。 |
| `thinkbot:sidebar:index` | `SidebarPageIndex` | Sidebar、Conversations Tab | 当前域下的页面索引，便于 `useStorage` 快速渲染列表。 |
| `thinkbot:sidebar:page:<hash>` | `PageData` | Sidebar 主视图 | `<hash>` 为标准化 URL 的 SHA-256 前 16 位，避免长度限制并防冲突。 |
| `thinkbot:sidebar:active` | `string` | Sidebar | 保存最近一次激活的 `<hash>`，用于快速恢复用户视图。 |

## 5.1 配置页
```typescript
// types/index.ts

// 通用
export type Theme = 'light' | 'dark' | 'system';
export type Language = 'zh_CN' | 'en_US';
export type ExtractionMethod = 'readability' | 'jina';
export type SyncProvider = 'none' | 'gist' | 'webdav';
export type LlmProvider = 'openai' | 'azure_openai' | 'google_gemini' | 'aws_bedrock' | 'openai_compatible';

export interface Timestamped {
  lastModified: number; // epoch ms
  isDeleted?: boolean;  // 软删除
}

// 基础设置（与 UI 基础页对应）
export interface BasicConfig extends Timestamped {
  theme: Theme;                    // 主题
  language: Language;              // 界面语言
  systemPrompt: string;            // 系统提示词
  defaultModelId: string;          // 默认模型ID
  contentDisplayHeight: number;    // 侧栏“内容展示区”默认高度(px)
  defaultExtractionMethod: ExtractionMethod; // 默认提取方式
  jinaApiKey?: string;             // 选用 Jina 时可选
}

// LLM 模型（与 UI 模型页对应）
export interface ModelItem extends Timestamped {
  id: string;                      // 唯一ID，基于标准化的modelName+随机字符串生成
  order: number;                   // 排序（拖拽）
  enabled: boolean;                // 开关
  provider: LlmProvider;           // 提供商
  displayName: string;             // UI显示名
  modelName: string;               // 平台具体模型ID/名称
  apiKey?: string;                 // OpenAI/Gemini/兼容类的密钥
  baseUrl?: string;                // OpenAI兼容/自托管基址
  temperature?: number;            // 0~2，UI限制到 0~2，步进 0.1
  maxTokens?: number;              // 最大tokens，UI可选填
  // provider专有字段
  azure?: { endpoint: string; apiVersion: string; deploymentId: string };
  bedrock?: { region: string; modelArn?: string };
}


// 快捷指令（与 UI 快捷指令页对应）
export interface QuickInputItem extends Timestamped {
  id: string;                      // 唯一ID
  order: number;                   // 排序（拖拽）
  enabled: boolean;                // 开关
  displayText: string;             // 按钮显示文案
  sendText: string;                // 实际发送文案
  autoTrigger: boolean;            // 打开侧栏后是否自动触发
  branchModelIds?: string[];       // 分支模型：模型ID列表（过滤禁用/删除的模型）
}

// 黑名单（与 UI 黑名单页对应）
export interface BlacklistPattern extends Timestamped {
  id: string;
  pattern: string;                 // URL匹配表达式，支持前后缀 * 通配
  description?: string;
  enabled: boolean;
}

// 同步（与 UI 云同步页对应）
export interface SyncConfig extends Timestamped {
  provider: SyncProvider;          // none|gist|webdav
  syncWhenSave: boolean;           // 保存即同步
  lastSyncTime: number;            // 上次同步时间戳
  deviceId: string;                // 设备唯一标识
  gist?: { token: string; gistId?: string };
  webdav?: { url: string; username: string; password: string };
}

// 顶层配置
export interface IConfig {
  basic: BasicConfig;
  llm_models: ModelItem[];
  quickInputs: QuickInputItem[];   // CHAT 固定Tab不在此列
  blacklist: BlacklistPattern[];
  sync: SyncConfig;
}
```

**useStorage 绑定**
- `CONFIG_KEY = "thinkbot:config:v1"`
- 选项页通过 `useStorage<IConfig>(CONFIG_KEY)` 将表单与存储绑定，提交时发送 `update-config` 消息，由后台落盘。
- Sidebar 与 Conversations UI 读取同一键，仅作展示（`readonly`），在 `useEffect` 中同步至 Zustand 的 UI 快照。
## 5.2 sidebar

```typescript

// 内容提取结果
export interface ExtractionResult {
	provider: 'readability' | 'jina';
	contentText: string;
	createdAt: string; // ISO 8601
}

// 用户消息
export interface UserMessage {
	id: string;
	displayContent: string;   // UI显示内容
	actualContent: string;    // 实际发送给LLM的内容
	isQuickInput?: boolean;
	quickInputId?: string;
	image?: string;           // Base64 or URL
	createdAt: number;        // Timestamp
}

// 模型回复分支
export interface MessageBranch {
	branchId: string;
	modelId: string;
	modelName: string;
	status: 'idle' | 'loading' | 'completed' | 'error' | 'cancelled';
	content: string;          // 仅在 'completed' 时持久化完整内容
	errorRaw?: unknown;	
	updatedAt: string;        // ISO 8601
}

// 单轮对话
export interface ChatTurn {
	id: string;
	userMessage: UserMessage;
	responses: MessageBranch[]; // 支持多模型回复分支
	createdAt: number;
}

// 对话标签页 (对应一个快捷指令或"聊天")
export interface ChatTab {
	id:string; // QuickInput.id 或 'chat'
	name: string;
	history: ChatTurn[];
	hasConversation: boolean;
	status: 'idle' | 'loading' | 'error';
	error?: string;
}

// 页面总数据结构 (存储单元)
export interface PageData {
	url: string; // 主键
	title: string;
	favicon?: string;
	extractedContent: ExtractionResult | null;
	tabs: Record<string, ChatTab>; // key: Tab ID
	lastModified: number;
	isDeleted?: boolean; // 软删除标记
}

export interface PageListEntry extends Timestamped {
	pageKey: string;             // 对应 `thinkbot:sidebar:page:<hash>`
	url: string;
	title: string;
	favicon?: string;
	lastConversationAt?: number; // 方便列表排序
}

export interface SidebarPageIndex extends Timestamped {
	pages: PageListEntry[];
}
```

**sidebar useStorage 说明**
- `PAGE_DATA_KEY = (pageKey: string) => "thinkbot:sidebar:page:" + pageKey`，Sidebar 根据当前 URL 计算 `<hash>` 并通过 `useStorage<PageData>(PAGE_DATA_KEY(hash))` 获取全量会话数据。
- `thinkbot:sidebar:index` 与 `thinkbot:sidebar:active` 使用 `useStorage` 按需订阅，分别用于列表渲染与恢复上次打开的页面。
- Background Streaming 时仅更新内存态，流式完成或失败后统一写入对应 `PageData` 键，触发 UI 自动刷新。
## 5.3 非持久化 UI 状态（Zustand）

```typescript
export interface SidebarRuntimeState {
  activePageKey?: string;         // 当前聚焦的 pageKey
  activeTabId: string;            // 当前选中的聊天标签
  composerDrafts: Record<string, string>; // 每个标签的草稿输入
  streamingBranch?: {
    turnId: string;
    branchId: string;
    partialContent: string;
    startedAt: number;
  };
  confirmDialog: {
    open: boolean;
    turnId?: string;
    branchId?: string;
  };
}

export interface OptionsRuntimeState {
  dirty: boolean;                        // 表单是否有未保存的修改
  testingModelId?: string;               // 正在测试连接的模型ID
  testStatus: 'idle' | 'loading' | 'success' | 'error';
  testMessage?: string;
}
```

- Zustand 仅用于保存上述瞬时/派生状态，浏览器刷新或扩展重载时即可重置。
- Sidebar 使用 `useStorage` 读取 `PageData` 后，在 `useEffect` 中将快照写入 `SidebarRuntimeState`，以支撑草稿缓存、流式进度等即时交互。
- 选项页 `OptionsRuntimeState` 负责管理表单脏值和测试反馈，不向 `chrome.storage` 写入，提交成功后由后台更新 `IConfig` 并通过 `useStorage` 回流。

## 6. 核心工作流程

### 6.1. LLM 调用与响应式流式更新 (关键流程)

此流程结合了后台处理的健壮性和前端响应式的优雅。

1.  UI (用户发送): 用户点击发送。UI 组件通过 `plasmo/messaging` 向后台发送 `start-conversation` 消息，包含所有必要上下文。UI 自身不直接修改 `storage`。
2.  后台 (接收与准备): 后台 `LLMService` 接收请求。它立即在 `storage` 中为当前会话创建一个新的 `assistant` `Message` 对象，其 `branch` 的 `status` 为 `loading`，`content` 为空。
3.  后台 (API 调用): `LLMService` 使用 `fetch` 调用 LLM 的流式 API。
4.  后台 (非实时写入 Storage): 当从 API 收到数据块 (chunk) 时，后台只更新UI数据，全部接受后，再更新 `storage` 中对应 `MessageBranch` 的 `content` 字段。
5.  后台 (完成/错误): 请求完成后，后台更新 `MessageBranch` 的 `status` 为 `success`。如果出错，则更新为 `error` 并将原始错误信息（调用的原始回复）存入 `error` 字段。
6.  状态恢复: 如果用户中途切换标签页再切回，侧边栏 UI 重新挂载。`useStorage` 会立即从 `storage` 中读取到当前消息的最新状态（可能是 `loading` 和部分 `content`），并无缝恢复 UI 显示，整个过程对用户透明。

### 6.2. 云同步 (基于时间戳合并)

1.  触发: 用户在选项页点击“保存”或手动同步。
2.  后台 (数据拉取): `SyncService` 并行地从云端（Gist/WebDAV）和本地 `chrome.storage.local` 拉取所有数据集。
3.  后台 (合并逻辑):
    -   以每一条独立的记录（如一个 `LanguageModel` 对象，一个 `PageData` 对象）为单位进行比较。
    -   Last Write Wins: 比较本地和云端记录的 `lastModified` 时间戳，时间戳最新的版本胜出。
    -   新增: 如果记录只存在于一方，则直接采纳。    
    -   软删除合并：
      - 双端都删除：保持删除状态
      - 本地删除vs远程数据：删除较新→保持删除，数据较新→恢复数据
      - 远程删除vs本地数据：删除较新→保持删除，数据较新→恢复数据
      - 都未删除：正常时间戳比较
4.  后台 (数据写回): 将合并后的最终数据集并行地写回本地 `storage` 和云端。
5.  后台 (清理): 同步完全成功后，启动一个清理任务，将本地 `storage` 中所有 `isDeleted: true` 的记录彻底移除。
6.  UI (状态反馈): 后台通过消息将同步结果（成功、失败、错误）广播给选项页 UI 进行展示。

### 6.3. 内容提取（在内容脚本中运行 Readability）

1.  **触发**：侧边栏挂载后，通过 `useStorage` 发现当前页面内容为空，于是向后台发送 `request-extraction` 消息。
2.  **权限校验与注入**：`ExtractionService` 先通过 `chrome.scripting.canExecuteScript` 或 `chrome.permissions.contains` 确认当前 URL 拥有 `host_permissions`（或处在 `activeTab` 授权窗格内）。若权限不足直接降级为云端提取，避免触发 MV3 注入异常。权限满足时使用 `chrome.scripting.executeScript` 注入 `contents/extractor.ts`，仅针对 `frameId: 0`、`world: 'ISOLATED'`，遵守 Chrome 对扩展脚本隔离的安全限制。
3.  **就地 Readability 提取**：注入脚本延迟至 `document.readyState === "complete"`，或通过 `MutationObserver` 等待 DOM 静默 500ms，以兼容 SPA 场景。脚本内联载入 `@mozilla/readability`，对当前 `document` 深拷贝（剔除 `script`、`style`、`noscript` 等噪音节点）后执行 `new Readability(clonedDocument).parse()`，生成 `{ title, byline, content, textContent, excerpt, lang }` 结构；无法访问的跨域 `<iframe>` 会被记录在 `unreachableIframes` 字段，便于后台补充提示。
4.  **结果归一化与传输**：内容脚本将正文、纯文本摘要和元数据拆分为多段消息，通过 `chrome.runtime.sendMessage` 逐段发送，遵守 Chrome 单条消息约 32 MB 的限制。正文超过 512 KB 时先在内容脚本侧用 `pako` 压缩；压缩后仍超限则退化为只发送摘要，并在状态字段标记 `payload: 'partial'`。
5.  **后台缓存与落盘**：后台收到消息后写入 `ExtractionService` 的内存缓存（键：`tabId + urlHash`），再异步持久化至 `chrome.storage.local`。若侧边栏仍保持打开，后台通过 `@plasmo/messaging` 回推 `extraction/update`，确保在官方 Side Panel API 的刷新约束下也能即时渲染。
6.  **兜底策略**：当 Readability 输出为空、正文 < 1 KB 或注入阶段因权限失败，后台将结果标记为 `fallback` 并调用 Jina 远端提取；远端成功后覆盖缓存并广播，同时在 `PageData` 中记录 `extractionSource: 'remote'` 以提示 UI。
7.  **会话持久化**：压缩后的完整结果同时写入 `chrome.storage.local` 与 `chrome.storage.session`，一方面支撑 Service Worker 冷启动恢复，另一方面避免 Chrome 在空闲时卸载页面上下文导致重复注入。

### 6.4. 切换标签页后自动关闭侧边栏（兼容 Chrome Side Panel 限制）

1.  **事件监听与限制**：Service Worker 启动时注册 `chrome.tabs.onActivated`、`chrome.tabs.onRemoved` 和 `chrome.windows.onFocusChanged`。Chrome 仅允许在用户手势（点击扩展图标或 `chrome.sidePanel.open`）后展示面板，监听逻辑不会主动开启新面板，只负责收尾旧上下文。
2.  **状态追踪与持久化**：在内存中维护 `activeSidebarTabId` 与 `activeSidebarWindowId`，并镜像到 `chrome.storage.session`。每当侧边栏在新标签页打开（由 `contents/sidebar.tsx` 向后台报告）时更新状态，以防 Service Worker 休眠后丢失上下文。
3.  **防抖与校验**：收到新的激活事件后，若 `tabId` 未变化或标签页已关闭则直接忽略；否则调用 `chrome.tabs.get` 验证旧标签页仍存在，再继续关闭流程，从而规避 Chrome 在快速切换时产生的重复事件。
4.  **关闭策略**：
    - **DOM 注入版本**：后台向旧标签页发送 `sidebar/force-close` 指令，`sidebarController.close()` 卸载 React 根节点、移除挂载容器并清理动画，满足自定义侧边栏的关闭需求。
    - **官方 sidePanel 版本**：由于 API 尚未提供 `close()` 方法，只能通过 `sidebar/unmount` 指令让前端清空内容，并调用 `chrome.sidePanel.setOptions({tabId: oldTabId, enabled: false})` 禁用旧标签页的面板，效果近似“自动收起”。
5.  **异常处理**：若消息通道断开或 `chrome.runtime.lastError` 存在，后台立即清理状态并停止重试；若用户已自行关闭面板，内容脚本会发送 `sidebar/status: 'closed'`，后台据此跳过重复关闭。
6.  **多窗口与会话恢复**：在窗口切换时借助 `windows.onFocusChanged` 更新 `activeSidebarWindowId`，防止跨窗口误关闭。当 Service Worker 冷启动时，从 `chrome.storage.session` 恢复上次记录的 `tabId`/`windowId`，仅对仍有效的标签发送清理请求。
7.  **合规性提醒**：自动关闭属于用户手势后的后续整理，符合 Chrome Web Store 指南；仍需在选项页提供开关以尊重用户控制，同时在文档中声明功能依赖 `tabs`、`sidePanel`、`storage` 与 `scripting` 权限。

## 7. 错误处理与用户反馈

-   提取/LLM 失败: 在分支消息内直接展示错误信息。
-   操作确认: 所有删除操作前，使用一个在点击处弹出的mini `ConfirmDialog` 组件进行二次确认。
