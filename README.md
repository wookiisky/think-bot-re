# Think Bot 浏览器扩展

一个强大的浏览器辅助工具，让用户能够与任何网页进行智能对话。通过提取网页正文内容，结合用户输入，利用大型语言模型 (LLM) 的能力，实现对页面内容的总结、问答、翻译、分析等多种功能。

## 特性

- 🤖 **智能对话**：与网页内容进行自然语言对话
- 📄 **内容提取**：自动提取网页正文，支持 Readability.js 和 Jina AI
- 🎯 **快捷指令**：预设常用提示词，一键快速操作
- 🔄 **多模型支持**：支持 OpenAI、Google Gemini、Azure OpenAI 等多种大语言模型
- 💾 **数据同步**：支持通过 GitHub Gist 或 WebDAV 同步配置和聊天记录
- 🌓 **主题切换**：支持浅色/深色主题
- 🌍 **国际化**：支持中文和英文界面

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite + Chrome Extension CRX 插件
- **样式**：Tailwind CSS + Headless UI
- **状态管理**：Zustand + TanStack Query
- **通信**：webext-bridge
- **数据压缩**：pako
- **内容提取**：Readability.js + Jina AI API
- **LLM SDK**：OpenAI、Google Generative AI、Azure OpenAI

## 开发环境要求

- Node.js >= 18.0.0
- pnpm（推荐）或 npm

## 快速开始

### 1. 克隆项目

\`\`\`bash
git clone <repository-url>
cd think-bot-re
\`\`\`

### 2. 安装依赖

\`\`\`bash
pnpm install
\`\`\`

### 3. 开发模式

\`\`\`bash
pnpm dev
\`\`\`

### 4. 加载扩展

1. 打开 Chrome 浏览器
2. 访问 \`chrome://extensions/\`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目的 \`dist\` 目录

### 5. 生产构建

\`\`\`bash
pnpm build
\`\`\`

### 6. 打包发布

\`\`\`bash
pnpm zip
\`\`\`

## 项目结构

\`\`\`
think-bot-re/
├── src/
│   ├── background/           # 后台脚本
│   │   ├── services/         # 核心业务逻辑
│   │   ├── handlers/         # 事件处理器
│   │   └── utils/           # 工具函数
│   ├── content/             # 内容脚本
│   ├── pages/               # 页面组件
│   │   ├── sidebar/         # 侧边栏
│   │   ├── options/         # 选项页面
│   │   ├── conversations/   # 会话页面
│   │   └── tutorial/        # 教程页面
│   ├── components/          # 通用组件
│   ├── hooks/              # 自定义 Hooks
│   ├── stores/             # 状态管理
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── config/             # 配置文件
│   ├── locales/            # 国际化文件
│   └── styles/             # 全局样式
├── public/                 # 静态资源
├── docs/                   # 项目文档
└── scripts/                # 构建脚本
\`\`\`

## 开发指南

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 和 Prettier 配置
- 组件命名使用 PascalCase
- 文件命名使用 camelCase

### 提交规范

使用语义化提交信息：

- \`feat\`: 新功能
- \`fix\`: 修复 bug
- \`docs\`: 文档更改
- \`style\`: 代码格式化
- \`refactor\`: 代码重构
- \`test\`: 添加测试
- \`chore\`: 构建过程或辅助工具的变动

### 国际化

所有用户界面文本都应使用 i18n，配置文件位于：
- \`src/locales/\` - React 组件使用
- \`public/_locales/\` - Chrome 扩展元数据

## 部署

### Chrome Web Store

1. 运行 \`pnpm zip\` 生成发布包
2. 访问 [Chrome 开发者控制台](https://chrome.google.com/webstore/devconsole)
3. 上传生成的 zip 文件
4. 填写扩展信息并提交审核

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 支持

如有问题或建议，请通过以下方式联系：

- GitHub Issues
- 邮箱：[your-email@example.com]

---

**Think Bot** - 让网页阅读更智能 🚀
