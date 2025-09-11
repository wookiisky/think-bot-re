/**
 * 消息路由处理器
 * 处理来自前端页面的消息并分发到相应的服务
 * 基于 sidebar_v2.md 的 CQRS 消息协议
 */

import { onMessage, sendMessage } from 'webext-bridge/background'
import { ConfigService } from '../services/config'
import { StorageService } from '../services/storage'
import { log } from '../utils/logger'
import type { 
  MessageEnvelope, 
  GetPageDataCmd, 
  TriggerExtractionCmd,
  DeletePageDataCmd,
  GetSettingsCmd,
  SaveSettingsCmd,
  OpenOptionsPageCmd,
  OpenConversationsPageCmd,
  OnDataChangedEvt,
  OnExtractionStatusChangedEvt
} from '../../types'

export class MessageHandler {
  private configService: ConfigService
  private storageService: StorageService

  constructor() {
    this.configService = ConfigService.getInstance()
    this.storageService = StorageService.getInstance()
    this.setupMessageListeners()
  }

  private setupMessageListeners() {
    
    // ========== 新的 CQRS 消息协议处理器 ==========
    
    // Ping 测试连接
    onMessage('ping', ({ data }) => {
      try {
        const { timestamp } = data as { timestamp: number }
        log.debug('Ping received', { timestamp, delay: Date.now() - timestamp })
        return { success: true, pong: true, serverTime: Date.now() }
      } catch (error) {
        log.error('Ping handler failed', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 获取当前标签页信息
    onMessage('getCurrentTab', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        return tab || null
      } catch (error) {
        log.error('Failed to get current tab', error)
        return null
      }
    })
    
    // 获取页面数据
    onMessage('getPageData', async ({ data }) => {
      try {
        const envelope = data as unknown as MessageEnvelope<GetPageDataCmd>
        const { url } = envelope.payload
        
        log.info('Getting page data', { url, correlationId: envelope.correlationId })
        
        const result = await this.storageService.getPageData(url)
        return { success: true, data: result.data }
      } catch (error) {
        log.error('Failed to get page data', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 触发内容提取
    onMessage('triggerExtraction', async ({ data }) => {
      let envelope: MessageEnvelope<TriggerExtractionCmd> | undefined
      try {
        envelope = data as unknown as MessageEnvelope<TriggerExtractionCmd>
        const { url, provider, force } = envelope.payload
        
        log.info('Triggering content extraction', { url, provider, force, correlationId: envelope.correlationId })
        
        // 广播提取状态变更事件
        this.broadcastExtractionStatus(url, 'loading', 'requesting_html')
        
        // TODO: 实际的内容提取逻辑
        // 这里应该调用 ExtractService.extractContent()
        
        // 模拟提取过程
        setTimeout(() => {
          this.broadcastExtractionStatus(url, 'loading', 'parsing')
        }, 500)
        
        setTimeout(() => {
          this.broadcastExtractionStatus(url, 'loading', 'persisting')
        }, 1000)
        
        setTimeout(() => {
          this.broadcastExtractionStatus(url, 'completed', 'completed')
          this.broadcastDataUpdate(url)
        }, 1500)
        
        return { success: true }
      } catch (error) {
        log.error('Failed to trigger extraction', error)
        this.broadcastExtractionStatus(envelope?.payload?.url || '', 'error', 'error', error instanceof Error ? error.message : 'Unknown error')
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 删除页面数据
    onMessage('deletePageData', async ({ data }) => {
      try {
        const envelope = data as unknown as MessageEnvelope<DeletePageDataCmd>
        const { url } = envelope.payload
        
        log.info('Deleting page data', { url, correlationId: envelope.correlationId })
        
        const result = await this.storageService.removePageData(url)
        
        if (result.success) {
          this.broadcastDataUpdate(url)
        }
        
        return result
      } catch (error) {
        log.error('Failed to delete page data', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 获取设置
    onMessage('getSettings', ({ data }) => {
      try {
        const envelope = data as unknown as MessageEnvelope<GetSettingsCmd>
        log.info('Getting settings', { correlationId: envelope.correlationId })
        
        const config = this.configService.getConfig()
        return { success: true, data: config }
      } catch (error) {
        log.error('Failed to get settings', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 保存设置
    onMessage('saveSettings', async ({ data }) => {
      try {
        const envelope = data as unknown as MessageEnvelope<SaveSettingsCmd>
        const { settings } = envelope.payload
        
        log.info('Saving settings', { correlationId: envelope.correlationId })
        
        await this.configService.updateConfig(settings as any)
        
        // 广播设置变更事件
        this.broadcastSettingsChanged()
        
        return { success: true }
      } catch (error) {
        log.error('Failed to save settings', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 打开选项页
    onMessage('openOptionsPage', async ({ data }) => {
      try {
        const envelope = data as unknown as MessageEnvelope<OpenOptionsPageCmd>
        log.info('Opening options page', { correlationId: envelope.correlationId })
        
        await chrome.tabs.create({
          url: chrome.runtime.getURL('src/pages/options/index.html')
        })
        
        return { success: true }
      } catch (error) {
        log.error('Failed to open options page', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 打开会话页
    onMessage('openConversationsPage', async ({ data }) => {
      try {
        const envelope = data as unknown as MessageEnvelope<OpenConversationsPageCmd>
        const { selectPageUrl } = envelope.payload
        
        log.info('Opening conversations page', { selectPageUrl, correlationId: envelope.correlationId })
        
        let url = chrome.runtime.getURL('src/pages/conversations/index.html')
        if (selectPageUrl) {
          url += `?selectPage=${encodeURIComponent(selectPageUrl)}`
        }
        
        await chrome.tabs.create({ url })
        
        return { success: true }
      } catch (error) {
        log.error('Failed to open conversations page', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 内容脚本就绪通知
    onMessage('contentReady', async ({ data, sender }) => {
      try {
        const { url, title, readyState, timestamp, favicon } = data as { 
          url: string
          title: string
          readyState: string
          timestamp: number 
          favicon?: string
        }
        
        log.info('Content script ready', { 
          url, 
          title,
          readyState, 
          timestamp,
          favicon,
          tabId: sender?.tabId 
        })
        
        return { success: true }
      } catch (error) {
        log.error('Content ready handler failed', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // ========== 原有的消息处理器 (保持兼容性) ==========
    
    // 配置相关消息
    onMessage('getConfig', () => {
      try {
        const config = this.configService.getConfig()
        return { success: true, data: config }
      } catch (error) {
        log.error('Failed to get config', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    onMessage('updateConfig', async ({ data }) => {
      try {
        await this.configService.updateConfig(data as any)
        return { success: true }
      } catch (error) {
        log.error('Failed to update config', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    onMessage('exportConfig', () => {
      try {
        const configJson = this.configService.exportConfig()
        return { success: true, data: configJson }
      } catch (error) {
        log.error('Failed to export config', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    onMessage('importConfig', async ({ data }) => {
      try {
        await this.configService.importConfig(data as string)
        return { success: true }
      } catch (error) {
        log.error('Failed to import config', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 页面数据相关消息
    onMessage('getPageData', async ({ data }) => {
      try {
        const { url } = data as { url: string }
        const result = await this.storageService.getPageData(url)
        return result
      } catch (error) {
        log.error('Failed to get page data', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    onMessage('setPageData', async ({ data }) => {
      try {
        const { url, pageData } = data as { url: string; pageData: any }
        const result = await this.storageService.setPageData(url, pageData)
        if (result.success) {
          // 通知前端数据更新
          this.broadcastDataUpdate(url)
        }
        return result
      } catch (error) {
        log.error('Failed to set page data', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    onMessage('removePageData', async ({ data }) => {
      try {
        const { url } = data as { url: string }
        const result = await this.storageService.removePageData(url)
        if (result.success) {
          this.broadcastDataUpdate(url)
        }
        return result
      } catch (error) {
        log.error('Failed to remove page data', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 存储统计
    onMessage('getStorageStats', async () => {
      try {
        const stats = await this.storageService.getStats()
        return { success: true, data: stats }
      } catch (error) {
        log.error('Failed to get storage stats', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    onMessage('clearStorage', async () => {
      try {
        const result = await this.storageService.clear()
        return result
      } catch (error) {
        log.error('Failed to clear storage', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // 内容提取消息
    onMessage('extractContent', async ({ data }) => {
      try {
        // TODO: 实现内容提取逻辑
        const { url, method } = data as { url: string; method: string }
        log.info('Content extraction requested', { url, method })
        return { success: true, data: { content: 'Mock content', title: 'Mock title' } }
      } catch (error) {
        log.error('Content extraction failed', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // LLM相关消息
    onMessage('sendLLMMessage', async ({ data }) => {
      try {
        // TODO: 实现LLM调用逻辑
        const { modelId } = data as { modelId: string }
        log.info('LLM message requested', { modelId })
        return { success: true, data: { messageId: 'mock-id' } }
      } catch (error) {
        log.error('LLM message failed', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    // LLM 流式事件（兼容旧前端发来的消息类型）
    onMessage('LLM_STREAM_START', async ({ data }) => {
      try {
        const { url, tabId, messageBranchId } = (data as any) || {}
        const payload = { url, tabId: String(tabId ?? ''), messageBranchId }
        await this.broadcastToAllWindows('onStreamStart', payload)
        return { success: true }
      } catch (error) {
        log.error('LLM stream start failed', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    onMessage('LLM_STREAM_CHUNK', async ({ data }) => {
      try {
        const { url, tabId, messageBranchId, chunk } = (data as any) || {}
        await this.sendStreamUpdate(url, String(tabId ?? ''), messageBranchId, String(chunk ?? ''))
        return { success: true }
      } catch (error) {
        log.error('LLM stream chunk failed', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    onMessage('LLM_STREAM_END', async ({ data }) => {
      try {
        const { url, tabId, messageBranchId } = (data as any) || {}
        const payload = { url, tabId: String(tabId ?? ''), messageBranchId }
        await this.broadcastToAllWindows('onStreamEnd', payload)
        return { success: true }
      } catch (error) {
        log.error('LLM stream end failed', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    log.info('Message handlers setup complete')
  }

  /**
   * 广播数据更新事件
   */
  private async broadcastDataUpdate(url: string) {
    try {
      const event: OnDataChangedEvt = { pageUrl: url }

      // 发送到所有窗口端点（按 tabId 广播）
      await this.broadcastToAllWindows('onDataChanged', event)

      log.debug('Data update broadcasted', { url })
    } catch (error) {
      log.warn('Failed to broadcast data update', error)
    }
  }

  /**
   * 广播提取状态变更事件
   */
  private async broadcastExtractionStatus(
    pageUrl: string, 
    status: 'loading' | 'completed' | 'error',
    stage?: string,
    error?: string
  ) {
    try {
      const event: OnExtractionStatusChangedEvt = {
        pageUrl,
        status,
        stage: stage as any,
        error
      }

      // 发送到所有窗口端点（按 tabId 广播）
      await this.broadcastToAllWindows('onExtractionStatusChanged', event)

      log.debug('Extraction status broadcasted', { pageUrl, status, stage })
    } catch (error) {
      log.warn('Failed to broadcast extraction status', error)
    }
  }

  /**
   * 广播设置变更事件
   */
  private async broadcastSettingsChanged() {
    try {
      const event = {} // 设置变更事件载荷

      // 发送到所有窗口端点（按 tabId 广播）
      await this.broadcastToAllWindows('onSettingsChanged', event)

      log.debug('Settings change broadcasted')
    } catch (error) {
      log.warn('Failed to broadcast settings change', error)
    }
  }

  /**
   * 发送流式更新
   */
  async sendStreamUpdate(url: string, tabId: string, messageBranchId: string, chunk: string) {
    try {
      const payload = { url, tabId, messageBranchId, chunk }
      await this.broadcastToAllWindows('onStreamUpdate', payload)
    } catch (error) {
      log.warn('Failed to send stream update', error)
    }
  }

  /**
   * Broadcast messages to all window contexts by tab id.
   */
  private async broadcastToAllWindows(messageId: string, data: any) {
    try {
      const tabs = await chrome.tabs.query({})
      const tabIds = (tabs || []).map(t => t.id).filter((id): id is number => typeof id === 'number')
      await Promise.all(tabIds.map(async (id) => {
        try {
          await sendMessage(messageId as any, data as any, `window@${id}`)
        } catch (err) {
          // ignore tabs without listeners
        }
      }))
    } catch (error) {
      log.warn('Failed to enumerate tabs for window broadcast', error)
    }
  }
}
