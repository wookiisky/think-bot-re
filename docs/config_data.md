# Think Bot 配置数据结构定义

本文档定义了 Think Bot 浏览器扩展的配置对象的 JSON Schema。它详细描述了每个配置项的用途、数据类型和结构

```javascript
/**
 * @typedef {Object} ThinkBotConfig - Think Bot 扩展的完整配置对象。
 */
const ThinkBotConfig = {
  /**
   * @property {string} exportedAt - 配置导出的 ISO 8601 格式日期时间字符串。
   * @example "2025-09-03T13:31:08.973Z"
   */
  exportedAt: "string",

  /**
   * @property {string} version - 导出配置的版本号。
   * @example "2.0"
   */
  version: "string",

  /**
   * @property {string} exportedBy - 导出此配置的来源标识。
   * @example "ThinkBot Extension"
   */
  exportedBy: "string",

  /**
   * @property {Config} config - 包含所有用户设置的核心配置对象。
   */
  config: {
    /**
     * @property {Object} llm_models - 语言模型列表的容器。
     */
    llm_models: {
      /**
       * @property {Array<LLMModel>} models - 用户配置的所有语言模型数组。可通过拖拽排序。
       */
      models: [
        {
          /**
           * @typedef {Object} LLMModel - 定义一个语言模型配置。
           */
          /**
           * @property {string} id - 模型的唯一标识符。
           */
          id: "string",
          /**
           * @property {string} name - 用户为模型指定的显示名称。
           * @example "Gemini Pro"
           */
          name: "string",
          /**
           * @property {string} provider - 模型提供商。
           * @example "gemini", "azure_openai", "openai"
           */
          provider: "string",
          /**
           * @property {boolean} enabled - 是否启用该模型。
           */
          enabled: "boolean",
          /**
           * @property {number} lastModified - 最后修改时间的时间戳。用于云同步时的冲突解决。
           */
          lastModified: "number",
          /**
           * @property {string} apiKey - 调用 API 所需的密钥。
           */
          apiKey: "string",
          /**
           * @property {string} baseUrl - API 的基础 URL。
           * @example "https://generativelanguage.googleapis.com"
           */
          baseUrl: "string",
          /**
           * @property {string|number} maxTokens - 模型支持的最大令牌数。
           */
          maxTokens: "string | number",
          /**
           * @property {string} model - 模型的具体 ID 或名称。
           * @example "gemini-2.5-pro"
           */
          model: "string",
          /**
           * @property {number} temperature - 控制生成文本的随机性，值越高越随机。
           */
          temperature: "number",
          /**
           * @property {Array<string>} [tools] - 模型可用的工具列表。
           */
          tools: ["string"],
          /**
           * @property {string} [apiVersion] - (特定于 Azure) API 的版本号。
           */
          apiVersion: "string",
          /**
           * @property {string} [deploymentName] - (特定于 Azure) 部署实例的名称。
           */
          deploymentName: "string",
          /**
           * @property {string} [endpoint] - (特定于 Azure) 服务的端点 URL。
           */
          endpoint: "string"
        }
      ]
    },

    /**
     * @property {Array<QuickInput>} quickInputs - 快捷指令配置数组。对应侧边栏的快捷 Tab，可通过拖拽排序。
     */
    quickInputs: [
      {
        /**
         * @typedef {Object} QuickInput - 定义一个快捷指令。
         */
        /**
         * @property {string} id - 快捷指令的唯一标识符。
         */
        id: "string",
        /**
         * @property {string} displayText - 在 Tab 上显示的文本。
         * @example "缩写"
         */
        displayText: "string",
        /**
         * @property {string} sendText - 点击 Tab 时实际发送给 LLM 的指令内容 (Prompt)。
         */
        sendText: "string",
        /**
         * @property {boolean} autoTrigger - 是否在侧边栏打开并提取内容后自动触发此指令。
         */
        autoTrigger: "boolean",
        /**
         * @property {boolean} isDeleted - 软删除标记，用于云同步。
         */
        isDeleted: "boolean"
      }
    ],

    /**
     * @property {Object} basic - 包含扩展的基础和全局设置。
     */
    basic: {
      /**
       * @property {string} defaultExtractionMethod - 默认的内容提取方式。
       * @example "readability", "jina"
       */
      defaultExtractionMethod: "string",
      /**
       * @property {string} jinaApiKey - 如果使用 Jina AI 提取，所需的 API Key。
       */
      jinaApiKey: "string",
      /**
       * @property {string} jinaResponseTemplate - (未使用或已废弃) Jina 响应模板。
       */
      jinaResponseTemplate: "string",
      /**
       * @property {string} systemPrompt - 全局系统提示词，会预置在与 LLM 的对话中。
       */
      systemPrompt: "string",
      /**
       * @property {number} contentDisplayHeight - 侧边栏内容展示区的默认高度。
       */
      contentDisplayHeight: "number",
      /**
       * @property {string} theme - 扩展的显示主题。
       * @example "light", "dark", "system"
       */
      theme: "string",
      /**
       * @property {string} defaultModelId - 默认选择的语言模型 ID，关联 `llm_models.models.id`。
       */
      defaultModelId: "string",
      /**
       * @property {string} language - 扩展界面的显示语言。
       * @example "zh_CN", "en"
       */
      language: "string",
      /**
       * @property {number} lastModified - 最后修改时间的时间戳。
       */
      lastModified: "number"
    },

    /**
     * @property {Object} blacklist - 黑名单设置，用于指定不希望扩展运行的网站。
     */
    blacklist: {
      /**
       * @property {Array<BlacklistPattern>} patterns - 黑名单 URL 模式规则数组。
       */
      patterns: [
        {
          /**
           * @typedef {Object} BlacklistPattern - 定义一条黑名单规则。
           */
          /**
           * @property {string} id - 规则的唯一标识符。
           */
          id: "string",
          /**
           * @property {string} pattern - 用于匹配 URL 的字符串模式。
           * @example "google.com/search"
           */
          pattern: "string",
          /**
           * @property {boolean} enabled - 是否启用该条规则。
           */
          enabled: "boolean"
        }
      ]
    },

    /**
     * @property {Object} sync - 云同步相关设置。
     * @description 注意：此对象只包含同步状态和设备信息，具体的服务商凭证（如 Gist Token, WebDAV 密码）不在此处导出，以确保安全。
     */
    sync: {
      /**
       * @property {boolean} syncWhenSave - 是否在选项页点击“保存”时自动触发云同步。
       */
      syncWhenSave: "boolean",
      /**
       * @property {number} lastSyncTime - 上次成功同步的时间戳。
       */
      lastSyncTime: "number",
      /**
       * @property {string} deviceId - 当前设备的唯一标识符，用于同步区分。
       */
      deviceId: "string"
    }
  }
};
```
