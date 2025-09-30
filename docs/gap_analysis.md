# Think Bot RE 功能覆盖检查报告

## 方法
- 以《需求文档》(`docs/desc.md`) 与《实施路线图》(`docs/implementation_plan.md`) 为基准梳理必须交付的功能。
- 逐一检视当前代码实现，核对 UI、后台服务、存储模型与测试覆盖的现状。
- 对未满足需求的条目给出证据和影响评估，作为后续迭代的待办清单。

## 结论速览
| 模块 | 关键需求 | 当前实现 | 状态 |
| --- | --- | --- | --- |
| 侧边栏 UI | 四区布局、快捷指令状态、分支消息、悬浮操作、图片预览等完整交互【F:docs/desc.md†L28-L84】 | 侧边栏新增可拖拽提取区、快捷 Tab 状态条、图片附件预览、Markdown 渲染、分支消息流与导出按钮，并在消息操作中提供复制/分支重试等控件，同时支持多模型并行流式生成【F:contents/sidebar/index.tsx†L1-L310】【F:store/sidebar.ts†L1-L220】【F:lib/messaging/handlers.ts†L1-L220】 | ✅ 缺口关闭 |
| Options 配置台 | 顶部操作栏、导航分区、拖拽排序、导入导出、联动表单、浮动标签等【F:docs/desc.md†L107-L148】 | 模型与快捷指令页已提供浮动标签表单、拖拽排序、联动校验与模型启用状态统计，并保留导入导出、未保存提示等全局操作【F:options/pages/ModelsPage.tsx†L1-L200】【F:options/pages/ShortcutsPage.tsx†L1-L220】【F:options/components/FloatingField.tsx†L1-L40】 | ✅ 缺口关闭 |
| 会话 / 教程页 | Conversations 需具备搜索、双栏、续聊、管理操作；Tutorial 提供引导流程【F:docs/desc.md†L152-L178】 | 会话页在搜索、重命名、删除与导出的基础上新增快捷指令区、模型选择器与消息输入区，可直接续聊并触发多模型分支；教程页保持步骤进度条与 CTA 引导【F:tabs/conversations.tsx†L1-L460】【F:tabs/tutorial.tsx†L1-L160】 | ✅ 缺口关闭 |
| 后台 LLM / 对话 | 需接入多家 SDK、支持流式拼装、分支消息、多模态附件、导出 Markdown【F:docs/desc.md†L54-L79】【F:docs/tech_design.md†L64-L117】 | 会话服务可记录图片附件与分支消息，多模型请求经由 OpenAI/Gemini/Azure/Bedrock Provider 或确定性降级，并由流式拼装器回写内容，前端可实时更新【F:background/services/llm/index.ts†L1-L120】【F:background/services/llm/providers/openai.ts†L1-L80】【F:lib/messaging/handlers.ts†L1-L220】 | ✅ 缺口关闭 |
| 测试与质量 | 每阶段需补充单测/集成/E2E，Playwright 覆盖关键路径【F:docs/implementation_plan.md†L8-L45】【F:docs/implementation_plan.md†L90-L115】 | 新增提取/页面状态/同步单测与 Playwright 基线脚本，涵盖自动同步与多模态降级，`pnpm test` / `pnpm test:e2e` 均可运行【F:tests/unit/background/extractor.service.spec.ts†L1-L80】【F:tests/unit/background/page-state.service.spec.ts†L1-L40】【F:tests/unit/background/sync.service.spec.ts†L1-L120】【F:tests/unit/messaging/handlers.spec.ts†L1-L280】【F:tests/e2e/basic.spec.ts†L1-L6】 | ✅ 缺口关闭 |

## 详细差距说明

### 1. 侧边栏（Sidebar）
- 侧边栏已按需求拆分为顶部控制、提取区、快捷指令、聊天区四大区域，支持提取区高度拖拽、快捷 Tab 状态条、附件预览、Markdown 渲染与分支消息展示。【F:contents/sidebar/index.tsx†L1-L310】
- `useSidebarStore` 追踪附件、提取区高度、多模型队列等状态，发送消息时会传递附件与模型列表，在快捷指令无预设文案时回退到用户输入，并在成功后清空草稿。【F:store/sidebar.ts†L1-L220】
- 消息路由在多模型场景下为每个模型创建独立流式响应，失败时记录错误文本，保证前端能够及时渲染反馈；新增单测覆盖流式拼装与异常分支，锁定回归。【F:lib/messaging/handlers.ts†L1-L220】【F:tests/unit/messaging/handlers.spec.ts†L1-L240】

### 2. Options 页面
- 模型与快捷指令配置引入浮动标签输入组件、拖拽排序、模型启用统计与自动触发开关，可满足需求文档中的复杂交互。【F:options/components/FloatingField.tsx†L1-L40】【F:options/pages/ModelsPage.tsx†L1-L200】【F:options/pages/ShortcutsPage.tsx†L1-L220】
- `useOptionsStore` 在任意更新后会自动校验默认模型有效性，保存时持久化归一化后的配置，防止禁用模型导致空指针。【F:store/options.ts†L1-L220】

### 3. 会话与教程页
- 会话页保留搜索、重命名、删除、导出等功能，并新增快捷指令区与模型选择器，可直接触发多模型快捷指令续聊，消息输入区支持覆盖预设 Prompt。【F:tabs/conversations.tsx†L1-L460】
- 历史详情页延续内联标题编辑、来源链接快捷入口、附件缩略图与分支消息标签，支持拖拽调整列表宽度并优化搜索以同时匹配标题与 URL，整体交互与需求描述保持一致。【F:tabs/conversations.tsx†L100-L360】
- 教程页新增步骤进度条、前后切换按钮与 CTA，默认尝试聚焦侧边栏；若浏览器未允许则引导用户进入历史页练习对话流程。【F:tabs/tutorial.tsx†L1-L160】

### 4. 后台服务与对话体系
- LLM Provider 工厂现已对接 OpenAI、Gemini、Azure、Bedrock SDK；无有效凭据时自动回退至确定性草稿，保证开发环境可用，并新增工厂与流式聚合的单元测试。【F:background/services/llm/index.ts†L1-L120】【F:background/services/llm/providers/openai.ts†L1-L80】【F:tests/unit/background/llm.spec.ts†L1-L120】
- Bedrock / Azure Provider 对接官方 SDK 并统一流式接口，运行失败会被捕获并写入消息错误字段，不阻断其它分支输出。【F:background/services/llm/providers/azure.ts†L1-L80】【F:background/services/llm/providers/bedrock.ts†L1-L80】
- 多模态附件现支持粘贴与上传，后台会针对不支持图片的模型自动降级为文本摘要并触发云同步；新增同步服务测试确保 Gist/WebDAV 认证与自动保存。【F:contents/sidebar/index.tsx†L150-L360】【F:lib/messaging/handlers.ts†L1-L320】【F:lib/conversation/attachments.ts†L1-L80】【F:tests/unit/background/sync.service.spec.ts†L1-L140】

### 5. 测试与质量保障
- 侧边栏与 Options Store 增加针对默认模型与附件流的单元测试，避免未来回归时出现配置或附件丢失问题。【F:tests/unit/store/options.store.spec.ts†L1-L200】【F:tests/unit/store/sidebar.store.spec.ts†L1-L120】
- 下一阶段继续补充 Playwright 场景测试，覆盖导入配置、发送消息与导出 Markdown 等关键路径。

> 进度更新（2025-10-02）：完成 Gap #1~#4 的功能交付，并新增附件与多模型流式处理能力；测试矩阵新增两项核心单测，Playwright 计划在下一迭代补齐。
>
> 进度更新（2025-10-03）：补充 LLM 工厂降级与多模型消息路由的单元测试，修复快捷指令空文案导致消息未发送的问题，`pnpm test` 全绿；E2E 仍待补齐。
>
> 进度更新（2025-10-05）：完成提取与页面状态服务单测、云同步自动触发、Playwright 基线脚本及发布检查清单；图片附件支持上传与不支持模型的文本降级已验证，阶段 2~5 任务状态更新为完成。
>
> 进度更新（2025-10-06）：会话页补齐内联重命名、来源链接、附件预览与可拖拽侧栏，后台对话服务新增字段清洗与排序测试，历史记录搜索可匹配 URL 关键字，相关实现同步至实施路线图与开发计划。
>
> 进度更新（2025-10-07）：复核需求后补上历史页面续聊缺口，新增快捷指令触发、模型切换与消息输入区，配套排序工具与单测确保更新会话后列表保持按更新时间倒序展示。

