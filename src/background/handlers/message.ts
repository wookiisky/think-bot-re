/**
 * 消息路由处理器
 * 处理来自前端页面的消息并分发到相应的服务
 */

import { onMessage, sendMessage } from 'webext-bridge/background'
import { ConfigService } from '../services/config'
import { StorageService } from '../services/storage'
import { log } from '../utils/logger'

export class MessageHandler {
  private configService: ConfigService
  private storageService: StorageService

  constructor() {
    this.configService = ConfigService.getInstance()
    this.storageService = StorageService.getInstance()
    this.setupMessageListeners()
  }

  private setupMessageListeners() {
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

    log.info('Message handlers setup complete')
  }

  /**
   * 广播数据更新事件
   */
  private async broadcastDataUpdate(url: string) {
    try {
      // 发送到所有前端页面
      await sendMessage('onDataChanged', { url }, 'sidebar')
      await sendMessage('onDataChanged', { url }, 'options')
      await sendMessage('onDataChanged', { url }, 'conversations')
      
      log.debug('Data update broadcasted', { url })
    } catch (error) {
      log.warn('Failed to broadcast data update', error)
    }
  }

  /**
   * 发送流式更新
   */
  async sendStreamUpdate(url: string, tabId: string, messageBranchId: string, chunk: string) {
    try {
      await sendMessage('onStreamUpdate', {
        url,
        tabId,
        messageBranchId,
        chunk
      }, 'sidebar')

      await sendMessage('onStreamUpdate', {
        url,
        tabId,
        messageBranchId,
        chunk
      }, 'conversations')
    } catch (error) {
      log.warn('Failed to send stream update', error)
    }
  }
}
