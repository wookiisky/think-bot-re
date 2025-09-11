/**
 * WebExt Bridge 消息桥接工具
 * 统一管理扩展各部分之间的通信
 * 基于 WEBEXT_BRIDGE_FIXES.md 的修复方案
 */

import { sendMessage as bridgeSendMessage, onMessage as bridgeOnMessage } from 'webext-bridge/window'
import type { MessageEnvelope, CommandMap, EventMap, LLMMessage } from '@/types'

// 消息发送超时时间
const MESSAGE_TIMEOUT = 10000

// 生成消息信封的工具函数
export const createMessageEnvelope = <T>(action: string, payload: T): MessageEnvelope<T> => {
  try {
    return {
      id: crypto.randomUUID(),
      source: 'sidebar',
      target: 'background',
      action,
      payload,
      version: 1,
      meta: {
        locale: navigator.language || 'en-US',
        traceId: crypto.randomUUID(),
        pageUrl: window.location?.href || '',
        timestamp: Date.now()
      }
    }
  } catch (error) {
    console.error('Failed to create message envelope:', error)
    // Fallback envelope
    return {
      id: `fallback-${Date.now()}`,
      source: 'sidebar',
      target: 'background',
      action,
      payload,
      version: 1,
      meta: {
        locale: 'en-US',
        traceId: `fallback-trace-${Date.now()}`,
        pageUrl: '',
        timestamp: Date.now()
      }
    }
  }
}

// 发送命令到后台的泛型函数
export const sendCommand = async <T extends keyof CommandMap>(
  action: T, 
  payload: CommandMap[T]
): Promise<any> => {
  try {
    console.log(`[MessageBridge] Sending command: ${action}`, payload)
    
    // Validate inputs
    if (!action) {
      throw new Error('Action is required')
    }
    
    const envelope = createMessageEnvelope(action, payload)
    
    if (!envelope || !envelope.id) {
      throw new Error('Failed to create valid message envelope')
    }
    
    // 设置超时保护
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Command ${action} timeout after ${MESSAGE_TIMEOUT}ms`)), MESSAGE_TIMEOUT)
    })
    
    const messagePromise = bridgeSendMessage(action, envelope, 'background')
    
    const result = await Promise.race([messagePromise, timeoutPromise])
    
    console.log(`[MessageBridge] Command ${action} response:`, result)
    return result
    
  } catch (error) {
    console.error(`[MessageBridge] Command ${action} failed:`, error)
    throw error
  }
}

// 事件监听器类型
export type EventListener<T extends keyof EventMap> = (event: EventMap[T]) => void | Promise<void>

// 事件监听器存储
const eventListenersMap: Map<string, Set<Function>> = new Map()

// 监听后台事件
export const onEvent = <T extends keyof EventMap>(
  eventType: T, 
  listener: EventListener<T>
): (() => void) => {
  console.log(`[MessageBridge] Registering event listener for: ${eventType}`)
  
  if (!eventListenersMap.has(eventType)) {
    eventListenersMap.set(eventType, new Set())
    
    // 注册 webext-bridge 监听器
    bridgeOnMessage(eventType, async ({ data }) => {
      console.log(`[MessageBridge] Received event: ${eventType}`, data)
      
      // Check if data exists before processing
      if (!data) {
        console.warn(`[MessageBridge] Received empty data for event: ${eventType}`)
        return
      }
      
      const listeners = eventListenersMap.get(eventType)
      if (listeners) {
        // 并行执行所有监听器
        const promises = Array.from(listeners).map(async (listener) => {
          try {
            // Safely access payload with fallback
            const payload = data.payload || data
            await listener(payload)
          } catch (error) {
            console.error(`[MessageBridge] Event listener error for ${eventType}:`, error)
          }
        })
        
        await Promise.all(promises)
      }
    })
  }
  
  const listeners = eventListenersMap.get(eventType)!
  listeners.add(listener)
  
  // 返回取消监听的函数
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      eventListenersMap.delete(eventType)
    }
  }
}

// 初始化消息桥接
export const initializeMessageBridge = async (): Promise<void> => {
  try {
    console.log('[MessageBridge] Initializing...')
    
    // 延迟一点时间确保扩展环境完全准备好
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 测试连接是否可用
    try {
      await bridgeSendMessage('ping', { timestamp: Date.now() }, 'background')
      console.log('[MessageBridge] Background connection test successful')
    } catch (testError) {
      console.warn('[MessageBridge] Background connection test failed, but continuing:', testError)
      // 不抛出错误，因为有些情况下测试可能失败但实际通信正常
    }
    
    console.log('[MessageBridge] Initialized successfully')
    
  } catch (error) {
    console.error('[MessageBridge] Initialization failed:', error)
    throw error
  }
}

// 获取当前标签页信息 (用于获取真实的页面URL)
export const getCurrentTab = async (): Promise<chrome.tabs.Tab | null> => {
  try {
    // 在sidebar context中，通过消息发送到background获取当前tab信息
    const result = await bridgeSendMessage('getCurrentTab', {}, 'background')
    
    // Validate the result
    if (result && typeof result === 'object' && result.id) {
      return result as chrome.tabs.Tab
    }
    
    console.warn('[MessageBridge] Invalid tab data received:', result)
    return null
  } catch (error) {
    console.error('[MessageBridge] Failed to get current tab:', error)
    return null
  }
}

// 专用的命令发送函数 (基于具体的命令类型)
export const messageBridge = {
  // 页面数据操作
  async getPageData(url: string) {
    return sendCommand('getPageData', { url })
  },
  
  async triggerExtraction(url: string, provider: 'readability' | 'jina', force?: boolean) {
    return sendCommand('triggerExtraction', { url, provider, force })
  },
  
  async deletePageData(url: string) {
    return sendCommand('deletePageData', { url })
  },
  
  // 导航操作
  async openOptionsPage() {
    return sendCommand('openOptionsPage', {})
  },
  
  async openConversationsPage(selectPageUrl?: string) {
    return sendCommand('openConversationsPage', { selectPageUrl })
  },
  
  // 配置操作
  async getSettings() {
    return sendCommand('getSettings', {})
  },
  
  async saveSettings(settings: unknown) {
    return sendCommand('saveSettings', { settings })
  },

  // LLM 调用（统一入口）
  async sendLLMMessage(params: { modelId?: string; messages: LLMMessage[]; options?: { temperature?: number; maxTokens?: number } }) {
    return sendCommand('sendLLMMessage', params)
  }
}

// 事件监听快捷方式
export const eventListeners = {
  onDataChanged: (listener: EventListener<'onDataChanged'>) => onEvent('onDataChanged', listener),
  onExtractionStatusChanged: (listener: EventListener<'onExtractionStatusChanged'>) => onEvent('onExtractionStatusChanged', listener),
  onSettingsChanged: (listener: EventListener<'onSettingsChanged'>) => onEvent('onSettingsChanged', listener),
  onSyncStatusChanged: (listener: EventListener<'onSyncStatusChanged'>) => onEvent('onSyncStatusChanged', listener),
  onStreamStart: (listener: EventListener<'onStreamStart'>) => onEvent('onStreamStart', listener),
  onStreamUpdate: (listener: EventListener<'onStreamUpdate'>) => onEvent('onStreamUpdate', listener),
  onStreamEnd: (listener: EventListener<'onStreamEnd'>) => onEvent('onStreamEnd', listener)
}
