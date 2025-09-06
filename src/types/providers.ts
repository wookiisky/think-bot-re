/**
 * 提供商相关类型定义
 */

// 通用提供商接口
export interface BaseProvider {
  id: string
  name: string
  enabled: boolean
}

// LLM 提供商接口
export interface ILLMProvider extends BaseProvider {
  initialize(config: any): Promise<void>
  sendMessage(messages: any[], options?: any): Promise<ReadableStream>
  validateConfig(config: any): boolean
  getModelInfo(): {
    name: string
    maxTokens: number
    supportedFeatures: string[]
  }
}

// 内容提取提供商接口
export interface IExtractionProvider extends BaseProvider {
  extractContent(html: string, url: string): Promise<{
    content: string
    title?: string
    error?: string
  }>
  validateConfig?(config: any): boolean
}

// 同步提供商接口
export interface ISyncProvider extends BaseProvider {
  initialize(credentials: any): Promise<void>
  upload(data: any): Promise<{ success: boolean; error?: string }>
  download(): Promise<{ success: boolean; data?: any; error?: string }>
  validateCredentials(credentials: any): Promise<boolean>
}

// 流式响应处理器
export interface StreamHandler {
  onStart?: () => void
  onChunk?: (chunk: string) => void
  onComplete?: (fullContent: string) => void
  onError?: (error: Error) => void
}

// LLM 消息格式
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  image?: string
}

// LLM 调用选项
export interface LLMCallOptions {
  temperature?: number
  maxTokens?: number
  stream?: boolean
  tools?: any[]
}

// LLM 响应
export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason?: string
}
