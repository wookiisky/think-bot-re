/**
 * 导出所有类型定义
 */

// 配置相关
export * from './config'

// 聊天相关
export * from './chat'

// 存储相关
export * from './storage'

// 提供商相关
export * from './providers'

// UI相关
export * from './ui'

// 通用类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

// 事件类型
export interface BaseEvent {
  type: string
  timestamp: number
  source: 'background' | 'content' | 'sidebar' | 'options' | 'conversations'
}

// 通信消息类型
export interface Message<T = any> extends BaseEvent {
  id: string
  data: T
  responseRequired?: boolean
}

// 错误类型
export class ThinkBotError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message)
    this.name = 'ThinkBotError'
  }
}

// 日志级别
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

// 日志条目
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: number
  context?: any
  source: string
}
