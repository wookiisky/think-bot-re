# Think Bot 数据结构与状态管理

本文档定义了 Think Bot 扩展中核心数据的结构、存储方式以及更新逻辑，作为开发的核心依据。设计目标是确保数据的一致性、可扩展性，并支持后台操作与多页面UI同步。

## 1. 核心理念

- **单一数据源 (Single Source of Truth)**: `chrome.storage.local` 是所有持久化数据的唯一权威来源。
- **状态驱动UI**: 所有UI（侧边栏、会话页面等）都应从中心化的状态管理（Zustand Store）中获取数据，该状态管理本身是 `chrome.storage` 中数据的响应式映射。
- **后台中心化更新**: 所有的核心数据写入/更新操作都应通过后台脚本 (`background`) 发起和处理，UI 页面通过发送消息 (`webext-bridge`) 来请求变更。后台处理完毕后，将更新后的数据存入`chrome.storage`，并通知所有前端页面刷新状态。
- **不可变性 (Immutability)**: 在更新状态时，应始终创建新的对象或数组，而不是直接修改现有状态，以利于 React 的变更检测和状态追溯。

## 2. 数据结构 (TypeScript Interfaces)

为了清晰地定义数据模型，我们采用 TypeScript 接口进行描述。

### 2.1 顶层页面数据 (`PageData`)

`PageData` 是与单个网页关联的所有数据的集合，也是存储在 `chrome.storage.local` 中的基本单位。

```typescript
// 与单个网页关联的所有数据的集合
interface PageData {
  // 页面URL，作为数据的主键
  url: string;
  // 页面标题
  title: string;
  // 页面图标
  favicon?: string;
  // 提取的页面正文内容
  extractedContent: {
    // 使用的提取器 ('readability' or 'jina')
    provider: string;
    // 提取的内容文本
    content: string;
    // 提取状态
    status: 'loading' | 'completed' | 'error';
    // 错误信息
    error?: string;
  };
  // 页面内的标签页数据，键为 Tab 的唯一 ID
  tabs: Record<string, ChatTab>;
  // 最后修改时间戳，用于云同步
  lastModified: number;
  // UI相关的持久化状态
  uiState: {
    // 内容展示区的用户自定义高度
    contentAreaHeight: number;
  };
  // 软删除标记，用于云同步
  isDeleted?: boolean;
}
```

### 2.2 聊天标签页 (`ChatTab`)

每个页面可以有多个标签页（默认的 "Chat" 和自定义的快捷指令），每个标签页拥有独立的对话历史。

```typescript
// 单个标签页的数据结构
interface ChatTab {
  // 标签页的唯一ID (例如: 'chat', 对于快捷指令，该ID在配置时生成)
  id: string;
  // 标签页的显示名称
  name: string;
  // 该标签页的聊天记录
  history: ChatTurn[];
  // 是否已有对话内容，用于UI状态判断
  hasConversation: boolean;
  // 当前标签页的全局状态
  status: 'idle' | 'loading' | 'error';
  // 错误信息
  error?: string;
}
```

### 2.3 对话回合 (`ChatTurn`)

`ChatTurn` 代表一次完整的交互，包含用户的提问和模型的一或多个回答（分支）。

```typescript
// 一次完整的对话回合，包含一个用户问题和多个模型回复
interface ChatTurn {
  // 对话回合的唯一ID
  id: string;
  // 用户发送的消息
  userMessage: UserMessage;
  // 模型的回复，可能存在多个分支
  responses: MessageBranch[];
  // 创建时间戳
  createdAt: number;
}
```

### 2.4 消息定义

#### 用户消息 (`UserMessage`)

```typescript
// 用户发送的消息
interface UserMessage {
  // 消息的唯一ID
  id: string;
  // 文本内容
  content: string;
  // 附加的图片 (Base64 或 URL)
  image?: string;
  // 创建时间戳
  createdAt: number;
}
```

#### 模型回复分支 (`MessageBranch`)

这是最关键的数据结构之一，它代表一个独立的模型回复，并包含支持流式更新所需的所有状态。

```typescript
// 模型的单次回复，作为 ChatTurn 的一个分支
interface MessageBranch {
  // 回复分支的唯一ID
  id: string;
  // 使用的语言模型的ID (关联到全局配置)
  modelId: string;
  // 回复的文本内容
  content: string;
  // 回复的生成状态
  status: 'loading' | 'completed' | 'error';
  // 错误信息
  error?: string;
  // 创建时间戳
  createdAt: number;
  // 最后修改时间戳
  lastModified: number;
}
```

## 3. 存储结构 (`chrome.storage.local`)

数据将以键值对的形式存储，为了性能和存储空间考虑，会对数据进行压缩。

-   **键 (Key)**: `page_` + 经过规范化处理的页面 `URL`。
    -   规范化处理包括：去除协议中的 `www.`，去除 `hash`，去除不必要的查询参数等，以确保同一页面的不同 URL 形式能对应到同一份数据。
-   **值 (Value)**: 使用 `pako` 库压缩后的 `PageData` 对象的 JSON 字符串。

**示例:**

```json
{
  "page_https://example.com/article/123": "H4sIAAAAAAAACr... (压缩后的 PageData 字符串)",
  "page_https://anothersite.com/path": "H4sIAAAAAAAACr... (压缩后的 PageData 字符串)",
  "global_config": "{...}"
}
```

## 4. 数据更新逻辑

所有的数据更新都遵循一个标准流程，以确保并发安全和状态同步。

### 4.1 核心流程

1.  **UI 发起请求**:
    -   例如，用户在侧边栏点击“发送”按钮。
    -   侧边栏的组件调用一个 `useMessage` Hook，该 Hook 通过 `webext-bridge` 向后台脚本发送一个消息，例如 `sendMessage`。
    -   消息中包含所有必要参数：`{ pageUrl: '...', tabId: 'chat', modelId: 'gpt-4', content: '你好' }`。

2.  **后台服务处理**:
    -   后台脚本的消息监听器接收到请求，并将其分发给 `LlmService`。
    -   `LlmService` 首先调用 `StorageService` 来更新数据状态。

3.  **更新本地存储 (State Change)**:
    -   `StorageService` 读取、解压并解析指定 URL 的 `PageData`。
    -   **创建占位符**: 它在 `ChatTab` 的 `history` 中创建一个新的 `ChatTurn`。这个 `ChatTurn` 包含用户的 `UserMessage` 和一个初始的 `MessageBranch` **占位符**。
        -   `MessageBranch` 的 `id` 在此时生成并唯一确定。
        -   其 `status` 设置为 `'loading'`，`content` 为空字符串。
    -   `StorageService` 将更新后的 `PageData` 对象压缩并写回 `chrome.storage.local`。

4.  **通知前端更新**:
    -   `StorageService` 在写入成功后，通过 `webext-bridge` 广播一个事件，例如 `onDataChanged`，并附带被更新页面的 URL。
    -   所有打开的前端页面（侧边栏、会话页）都监听此事件。

5.  **UI 响应式更新**:
    -   前端的 Zustand `store` 接收到 `onDataChanged` 事件后，会重新从 `chrome.storage.local` 加载对应页面的最新数据，并更新其内部状态。
    -   由于 React 组件订阅了 `store`，UI 会自动重新渲染，此时用户会看到自己的消息和模型回复区域的加载动画。

### 4.2 流式响应更新：性能与一致性的平衡

为实现打字机效果，同时保证数据持久性和UI响应速度，采用一种结合了**乐观更新 (Optimistic Update)** 和 **延迟持久化 (Debounced Persistence)** 的混合策略。

1.  **后台发起 LLM 调用**:
    -   在步骤 4.1.3 创建占位符并**首次**写入存储后，`LlmService` 开始调用 LLM API。它会将所有关键 ID (`pageUrl`, `tabId`, `chatTurnId`, `messageBranchId`) 与该次 API 请求关联。

2.  **处理数据流 (Stream) 与乐观更新**:
    -   当 LLM API 返回数据块 (`chunk`) 时，`LlmService` 的流处理器会接收到。
    -   **实时推送**: 处理器**立即**通过 `webext-bridge` 将 `chunk` 和对应的所有ID直接发送给前端的 `Zustand store`。
    -   **前端乐观更新**: `store` 接收到消息后，**直接在内存中**更新对应的 `MessageBranch` 的 `content`。由于UI组件订阅了 `store`，会立刻重新渲染，实现最低延迟的打字机效果。

3.  **结束流与最终一致性**:
    -   当数据流结束时，`LlmService` 会最后一次调用 `StorageService`。
    -   `StorageService` 会将包含完整消息内容、`status` 更新为 `'completed'`（或 `'error'`）的最终版 `PageData` **立即、无延迟地**写入 `chrome.storage.local`。
    -   这次最终写入确保了数据的最终一致性。
