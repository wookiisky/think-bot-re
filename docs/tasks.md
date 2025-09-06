# Think Bot 重构开发计划

## 参考文档
- desc.md - 描述了功能、UI和交互，包括侧边栏、会话页面、选项页面、教程页面，以及核心交互流程
- dev.md - 技术选型和开发规范，详细的项目结构、命名约定、架构设计等
- page_data.md - 数据结构和状态管理，定义了PageData、ChatTab、ChatTurn等核心数据结构
- config_data.md - 定义了配置数据结构，包括LLM模型、快捷指令、基础设置、黑名单、同步设置等

## 注意点
- 开发环境为windows，使用对应命令和工具
- 注意chrome扩展开发的API和限制
- 注意状态数据的更新

---

## 阶段一：项目初始化与核心架构 (Milestone 1: Project Setup & Core Architecture)

**目标**: 搭建项目骨架，完成基础配置，建立后台服务的基本框架和数据模型。此阶段结束时，应有一个可运行但无具体功能的扩展程序。

-   [ ] **1.1 环境搭建**:
    -   [ ] 1.1.1 初始化 Vite + React + TypeScript 项目。
    -   [ ] 1.1.2 安装所有在 `dev.md` 中列出的核心依赖 (`react`, `react-router`, `zustand`, `tailwindcss` 等)。
    -   [ ] 1.1.3 配置 Vite (`vite.config.ts`) 以支持 Chrome 扩展开发，包括 `manifest.json` 的生成和多页面入口（sidebar, options, conversations）。
    -   [ ] 1.1.4 配置 TypeScript (`tsconfig.json`)，包括路径别名 `@/*`。
    -   [ ] 1.1.5 配置 Tailwind CSS (`tailwind.config.js`)。
    -   [ ] 1.1.6 配置 ESLint 和 Prettier，并集成到开发流程中。

-   [ ] **1.2 核心类型与数据结构定义**:
    -   [ ] 1.2.1 在 `src/types/` 目录下，根据 `config_data.md` 和 `page_data.md` 定义所有核心 TypeScript 接口 (`ThinkBotConfig`, `PageData`, `ChatTab`, `ChatTurn`, `UserMessage`, `MessageBranch` 等)。

-   [ ] **1.3 后台服务架构搭建**:
    -   [ ] 1.3.1 创建 `src/background/` 目录结构。
    -   [ ] 1.3.2 **配置服务 (`config.ts`)**: 实现一个服务，用于加载、合并和提供默认配置与用户配置。
    -   [ ] 1.3.3 **存储服务 (`storage.ts`)**: 实现一个底层服务，封装 `chrome.storage.local` 的读写操作，并集成 `pako` 进行数据压缩/解压。
    -   [ ] 1.3.4 **日志服务 (`logger.ts`)**: 建立统一的日志系统 (Winston)。
    -   [ ] 1.3.5 **通信桥梁 (`webext-bridge`)**: 初始化并配置 `webext-bridge`，定义后台与前端页面之间的消息协议。

-   [ ] **1.4 基础页面搭建**:
    -   [ ] 1.4.1 创建 `src/pages/` 目录结构，包含 `sidebar`, `options`, `conversations` 的基本入口组件和路由。
    -   [ ] 1.4.2 设置 React Router，确保可以通过 URL 或扩展动作正确导航到不同页面。

**阶段性验证**:
-   项目可以通过 `npm run dev` 成功启动。
-   生成的 `dist` 目录可以作为未打包的扩展在 Chrome 中成功加载。
-   点击扩展图标可以弹出（空的）侧边栏。
-   可以手动导航到（空的）选项页和会话页。
-   后台脚本可以成功加载，并在扩展的Service Worker中看到日志输出。

---

## 阶段二：选项页面与核心配置管理 (Milestone 2: Options Page & Core Configuration)

**目标**: 实现完整的选项页面，允许用户配置所有核心功能（模型、快捷指令、同步等）。此阶段结束时，用户的所有配置都能被正确保存和读取。

-   [ ] **2.1 状态管理 (`Zustand`)**:
    -   [ ] 2.1.1 创建 `src/stores/configStore.ts`，用于管理全局配置状态，并实现与后台存储服务的同步。

-   [ ] **2.2 通用 UI 组件开发**:
    -   [ ] 2.2.1 在 `src/components/ui/` 中，创建项目所需的基础 UI 组件（`Button`, `Input`, `Select`, `Switch`, `Modal` 等）。
    -   [ ] 2.2.2 创建通用功能组件，特别是 `DragDropList` (`@dnd-kit/sortable`) 和 `ConfirmDialog`。

-   [ ] **2.3 选项页面 UI 实现**:
    -   [ ] 2.3.1 实现选项页面的两栏式布局 (`Header`, `Sidebar`, `MainContent`)。
    -   [ ] 2.3.2 **基础设置 (`BasicSettings.tsx`)**: 开发 UI，允许用户配置默认模型、主题、语言、系统提示词等。
    -   [ ] 2.3.3 **语言模型配置 (`ModelConfig.tsx`)**: 开发 UI，允许用户添加、删除、编辑和拖拽排序语言模型。
    -   [ ] 2.3.4 **快捷指令配置 (`QuickInputConfig.tsx`)**: 开发 UI，允许用户添加、删除、编辑和拖拽排序快捷指令。
    -   [ ] 2.3.5 **黑名单配置 (`BlacklistSettings.tsx`)**: 开发 UI，管理黑名单列表。
    -   [ ] 2.3.6 **导入/导出 (`ImportExport.tsx`)**: 实现导入和导出配置的按钮和逻辑。

-   [ ] **2.4 后台服务实现**:
    -   [ ] 2.4.1 完善 **配置服务 (`config.ts`)** 的更新和保存逻辑，确保前端的修改可以通过消息传递到后台并持久化。
    -   [ ] 2.4.2 **黑名单服务 (`blacklist.ts`)**: 实现后台的黑名单匹配和管理逻辑。

**阶段性验证**:
-   选项页面能正确显示所有配置项。
-   在选项页面修改任何设置并点击“保存”后，数据能被持久化到 `chrome.storage.local`。
-   关闭并重新打开选项页面后，所有修改都应被保留。
-   可以成功导出包含所有配置的 JSON 文件，并能成功导入。
-   拖拽排序功能正常，顺序被正确保存。

---

## 阶段三：侧边栏核心交互与内容提取 (Milestone 3: Sidebar Core Interaction & Content Extraction)

**目标**: 实现侧边栏的核心 UI 和交互，完成网页内容的提取和展示。此阶段结束时，用户可以在侧边栏看到从当前页面提取的正文。

-   [ ] **3.1 状态管理 (`Zustand`)**:
    -   [ ] 3.1.1 创建 `src/stores/appStore.ts` 和 `uiStore.ts`，用于管理当前活动标签页的状态、侧边栏 UI 状态（如内容区高度）等。

-   [ ] **3.2 内容提取服务**:
    -   [ ] 3.2.1 在 `src/background/services/extraction/` 中，实现 `ReadabilityExtractor`。
    -   [ ] 3.2.2 实现 `ExtractionService`，该服务接收来自前端的请求，调用相应的内容提取器，并将结果存入 `StorageService`。
    -   [ ] 3.2.3 实现 `Content Script` (`src/content/`)，其主要职责是监听后台消息并返回 `document.body.innerHTML`。

-   [ ] **3.3 侧边栏 UI 实现**:
    -   [ ] 3.3.1 实现侧边栏的整体布局（顶部控制栏、内容区、快捷指令区、聊天区、输入区）。
    -   [ ] 3.3.2 **顶部控制栏 (`ControlBar.tsx`)**: 实现重新提取、复制、打开新页面等按钮。
    -   [ ] 3.3.3 **内容展示区 (`ContentArea.tsx`)**: 实现可拖拽调整高度的面板，用于展示提取的文本内容，并处理加载中、成功、失败三种状态。

-   [ ] **3.4 核心交互流程**:
    -   [ ] 3.4.1 实现打开侧边栏时自动触发内容提取的流程。
    -   [ ] 3.4.2 实现黑名单检查逻辑，如果页面在黑名单中，则在侧边栏弹出确认提示。
    -   [ ] 3.4.3 实现切换浏览器标签页时，侧边栏内容能正确更新或关闭。

**阶段性验证**:
-   在任意文章页面打开侧边栏，能够自动提取并正确显示正文内容。
-   内容展示区的高度可以自由拖拽并被记忆。
-   点击“重新提取”按钮可以再次执行提取流程。
-   在黑名单网站上打开侧边栏会显示提示。
-   切换到不受支持的页面（如 `chrome://`）时，侧边栏行为符合预期（例如，打开会话页面）。

---

## 阶段四：聊天功能与大模型集成 (Milestone 4: Chat Functionality & LLM Integration)

**目标**: 实现完整的聊天交互功能，包括发送消息、多模型支持、流式响应和历史记录管理。

-   [ ] **4.1 LLM 服务**:
    -   [ ] 4.1.1 在 `src/background/services/llm/` 中，定义 `abstractLLMProvider.ts` 和 `ILLMProvider` 接口。
    -   [ ] 4.1.2 至少实现一个具体的 LLM Provider (例如 `openaiProvider.ts`)。
    -   [ ] 4.1.3 实现 `LLMProviderFactory`，用于根据配置动态创建 Provider 实例。
    -   [ ] 4.1.4 实现 `StreamHandler`，处理来自 LLM API 的流式数据。
    -   [ ] 4.1.5 实现 `LlmService`，作为与前端交互的主入口，负责组装 Prompt、调用 Provider、处理响应并更新存储。

-   [ ] **4.2 状态管理 (`Zustand`)**:
    -   [ ] 4.2.1 创建 `src/stores/chatStore.ts`，管理当前页面的所有聊天数据 (`PageData`)，并响应后台的数据变更通知。

-   [ ] **4.3 侧边栏聊天 UI**:
    -   [ ] 4.3.1 **快捷指令区 (`QuickTabs.tsx`)**: 实现 Tab 切换逻辑，并能根据 `chatStore` 的数据状态显示不同的样式（有数据/加载中）。
    -   [ ] 4.3.2 **聊天交互区 (`ChatArea.tsx`)**:
        -   [ ] 4.3.2.1 开发 `Message.tsx` 组件，用于渲染用户和 AI 的消息。
        -   [ ] 4.3.2.2 集成 `MarkdownRenderer` (`marked`) 以正确显示格式化内容。
        -   [ ] 4.3.2.3 实现 `TypingIndicator`（打字机效果）。
    -   [ ] 4.3.3 **输入区域 (`InputArea.tsx`)**:
        -   [ ] 4.3.3.1 实现可自适应高度的文本输入框。
        -   [ ] 4.3.3.2 实现模型选择下拉菜单。
        -   [ ] 4.3.3.3 实现“发送”、“附带页面内容”、“停止”等功能按钮。

-   [ ] **4.4 数据更新流程**:
    -   [ ] 4.4.1 实现 `desc.md` 中定义的“数据更新逻辑”和“流式响应更新”的完整流程，确保前端的乐观更新与后台的最终数据持久化一致。

**阶段性验证**:
-   在侧边栏输入问题并发送后，能够调用 LLM API 并以流式方式显示回答。
-   对话历史被正确保存，关闭并重新打开侧边栏后，历史记录依然存在。
-   可以在不同的模型之间切换。
-   “附带页面内容”开关可以控制是否将页面正文作为上下文发送。
-   点击快捷指令 Tab 可以发送预设的 Prompt。

---

## 阶段五：高级功能与体验优化 (Milestone 5: Advanced Features & UX Refinements)

**目标**: 实现分支消息、消息操作、会话管理页面和云同步等高级功能，并对整体体验进行打磨。

-   [ ] **5.1 高级聊天功能**:
    -   [ ] 5.1.1 **分支消息 (`BranchMessages.tsx`)**: 实现并排展示多个模型回复的 UI。
    -   [ ] 5.1.2 **消息悬浮按钮 (`MessageActions.tsx`)**: 实现对用户消息和 AI 回复的不同操作按钮（编辑、重试、复制、分支等）。
    -   [ ] 5.1.3 实现多模态输入，允许用户粘贴图片。

-   [ ] **5.2 会话页面 (`Conversations`)**:
    -   [ ] 5.2.1 实现 `ConversationList.tsx`，展示所有历史会话，并支持搜索。
    -   [ ] 5.2.2 实现 `ConversationView.tsx`，复用侧边栏的大部分聊天组件，用于展示和续聊选定的会话。
    -   [ ] 5.2.3 实现会话的删除和重命名功能。

-   [ ] **5.3 云同步服务**:
    -   [ ] 5.3.1 在 `src/background/services/sync/` 中，定义 `abstractSyncProvider.ts`。
    -   [ ] 5.3.2 实现至少一个同步 Provider (如 `githubSyncProvider.ts`)。
    -   [ ] 5.3.3 实现 `DataMerger.ts`，处理基于 `lastModified` 时间戳的本地与云端数据合并逻辑，包括软删除 (`isDeleted`)。
    -   [ ] 5.3.4 实现 `SyncService`，并在选项页面提供手动同步触发和状态显示。
    -   [ ] 5.3.5 在选项页面 `SyncSettings.tsx` 中完成凭证配置 UI。

-   [ ] **5.4 教程页面 (`Tutorial`) 与国际化**:
    -   [ ] 5.4.1 创建首次安装时显示的教程页面。
    -   [ ] 5.4.2 集成 `react-i18next`，将所有 UI 硬编码文本替换为 i18n key，并提供中/英文语言包。
    -   [ ] 5.4.3 **i18n简化存储实现**:
        -   [ ] 5.4.3.1 采用key自描述的命名方式 (`{category}_{item}`, `{module}_{component}_{state}`)
        -   [ ] 5.4.3.2 去除description字段，直接使用 `"key": "value"` 的扁平结构
        -   [ ] 5.4.3.3 按功能模块组织国际化文件 (`common.json`, `sidebar.json`, `options.json`, `errors.json`)
        -   [ ] 5.4.3.4 确保key命名具有良好的可读性和自解释性

**阶段性验证**:
-   可以成功创建分支消息，并排展示不同模型的回复。
-   消息上的悬浮按钮功能均可正常使用。
-   会话页面能正确列出、搜索和加载所有历史聊天记录。
-   配置云同步后，可以在不同设备间同步配置和聊天数据。
-   删除和修改操作可以通过同步在设备间正确反映。
-   可以在中英文之间切换界面语言。
-   国际化文件采用简化存储格式，key命名清晰自解释，无冗余字段。
-   所有UI文本正确使用i18n key，无硬编码文本残留。

---

## 阶段六：测试、打包与发布 (Milestone 6: Testing, Packaging & Release)

**目标**: 进行全面的测试，修复 Bug，优化性能，并准备最终的发布包。

-   [ ] **6.1 全面测试**:
    -   [ ] 6.1.1 对所有功能进行端到端的手动测试。
    -   [ ] 6.1.2 在不同的网站上测试内容提取的兼容性。
    -   [ ] 6.1.3 测试不同网络环境下的 LLM 调用和云同步稳定性。
    -   [ ] 6.1.4 响应式设计测试，确保在不同侧边栏宽度下 UI 表现正常。

-   [ ] **6.2 性能优化**:
    -   [ ] 6.2.1 检查并优化 React 组件的渲染性能。
    -   [ ] 6.2.2 分析 `chrome.storage` 的使用，确保数据读写高效。

-   [ ] **6.3 构建与打包**:
    -   [ ] 6.3.1 编写并完善 `scripts/` 目录下的构建和打包脚本。
    -   [ ] 6.3.2 执行 `npm run build` 生成生产环境代码。
    -   [ ] 6.3.3 执行 `npm run zip` 生成可供上传到 Chrome Web Store 的 `.zip` 包。

-   [ ] **6.4 文档完善**:
    -   [ ] 6.4.1 编写或更新 `README.md`，包括项目介绍、开发指南和使用说明。
    -   [ ] 6.4.2 检查所有代码注释和文档。

**阶段性验证**:
-   所有核心功能无明显 Bug。
-   扩展在高负载下依然表现稳定。
-   最终打包的 `.zip` 文件可以成功安装并在浏览器中运行。
-   项目文档清晰、完整。
