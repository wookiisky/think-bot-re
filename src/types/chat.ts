/**
 * 聊天相关类型定义
 * 基于 page_data.md 文档
 */

// 用户消息
export interface UserMessage {
  id: string
  displayContent: string  // UI中显示的内容（如 Quick Input 的 displayText）
  actualContent: string   // 实际发送给 LLM 的内容（如 Quick Input 的 sendText）
  isQuickInput?: boolean  // 标识是否来自快捷指令
  quickInputId?: string   // 如果来自快捷指令，记录其ID
  image?: string          // Base64 或 URL
  createdAt: number
}

// 模型回复分支
export interface MessageBranch {
  id: string
  modelId: string // 关联到全局配置中的模型ID
  content: string
  status: 'loading' | 'completed' | 'error'
  error?: string
  createdAt: number
  lastModified: number
}

// 对话回合
export interface ChatTurn {
  id: string
  userMessage: UserMessage
  responses: MessageBranch[]
  createdAt: number
}

// 聊天标签页
export interface ChatTab {
  id: string
  name: string
  history: ChatTurn[]
  hasConversation: boolean
  status: 'idle' | 'loading' | 'error'
  error?: string
}

// 提取内容
export interface ExtractedContent {
  provider: 'readability' | 'jina'
  content: string
  status: 'loading' | 'completed' | 'error'
  error?: string
}

// UI状态
export interface UIState {
  contentAreaHeight: number
}

// 页面数据 - 顶层数据结构
export interface PageData {
  url: string
  title: string
  favicon?: string
  extractedContent: ExtractedContent
  tabs: Record<string, ChatTab> // 键为Tab的唯一ID
  lastModified: number
  uiState: UIState
  isDeleted?: boolean // 软删除标记
}

// 消息类型枚举
export type MessageStatus = 'loading' | 'completed' | 'error'
export type TabStatus = 'idle' | 'loading' | 'error'
export type ExtractionStatus = 'loading' | 'completed' | 'error'

// 聊天相关事件类型
export interface ChatEvents {
  sendMessage: {
    pageUrl: string
    tabId: string
    modelId: string
    displayContent: string  // UI显示的内容
    actualContent: string   // 实际发送的内容
    isQuickInput?: boolean  // 是否来自快捷指令
    quickInputId?: string   // 快捷指令ID
    image?: string
    includeContent: boolean
  }
  stopGeneration: {
    pageUrl: string
    tabId: string
    messageBranchId: string
  }
  retryMessage: {
    pageUrl: string
    tabId: string
    turnId: string
  }
  editMessage: {
    pageUrl: string
    tabId: string
    turnId: string
    newDisplayContent: string  // 新的显示内容
    newActualContent: string   // 新的实际发送内容
  }
  createBranch: {
    pageUrl: string
    tabId: string
    turnId: string
    modelId: string
  }
}
