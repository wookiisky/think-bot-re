/**
 * 配置相关类型定义
 * 基于 config_data.md 文档
 */

// LLM模型配置
export interface LLMModel {
  id: string
  name: string
  provider: 'openai' | 'gemini' | 'azure_openai' | 'bedrock'
  enabled: boolean
  lastModified: number
  apiKey: string
  baseUrl: string
  maxTokens: string | number
  model: string
  temperature: number
  tools?: string[]
  thinkingBudget?: number
  // Azure specific
  apiVersion?: string
  deploymentName?: string
  endpoint?: string
}

// 快捷指令配置
export interface QuickInput {
  id: string
  displayText: string
  sendText: string
  autoTrigger: boolean
  isDeleted?: boolean
  lastModified: number
}

// 黑名单规则
export interface BlacklistPattern {
  id: string
  pattern: string
  enabled: boolean
}

// 基础设置
export interface BasicConfig {
  defaultExtractionMethod: 'readability' | 'jina'
  jinaApiKey: string
  jinaResponseTemplate?: string
  systemPrompt: string
  contentDisplayHeight: number
  theme: 'light' | 'dark' | 'system'
  defaultModelId: string
  language: 'zh_CN' | 'en'
  lastModified: number
}

// 黑名单设置
export interface BlacklistConfig {
  patterns: BlacklistPattern[]
}

// 同步设置
export interface SyncConfig {
  syncWhenSave: boolean
  lastSyncTime: number
  deviceId: string
  provider?: 'github' | 'webdav'
  credentials?: {
    github?: {
      gistId: string
      token: string
    }
    webdav?: {
      url: string
      username: string
      password: string
    }
  }
}

// 完整的配置对象
export interface ThinkBotConfig {
  exportedAt: string
  version: string
  exportedBy: string
  config: {
    llm_models: {
      models: LLMModel[]
    }
    quickInputs: QuickInput[]
    basic: BasicConfig
    blacklist: BlacklistConfig
    sync: SyncConfig
  }
}

// 配置存储键名
export const CONFIG_STORAGE_KEY = 'think_bot_config'
export const PAGE_DATA_PREFIX = 'page_'
