/**
 * 浏览器标签页事件处理器
 */

import { sendMessage } from 'webext-bridge/background'
import { log } from '../utils/logger'

export class TabHandler {
  constructor() {
    this.setupTabListeners()
  }

  private setupTabListeners() {
    // 标签页激活事件
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        const tab = await chrome.tabs.get(activeInfo.tabId)
        if (tab.url) {
          log.debug('Tab activated', { tabId: activeInfo.tabId, url: tab.url })
          
          // 通知前端标签页变化
          await this.notifyTabChange(tab.url, activeInfo.tabId)
        }
      } catch (error) {
        log.error('Failed to handle tab activation', error)
      }
    })

    // 标签页更新事件
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      // 只处理完成加载的页面
      if (changeInfo.status === 'complete' && tab.url) {
        log.debug('Tab updated', { tabId, url: tab.url })
        
        // 通知前端页面更新
        await this.notifyTabChange(tab.url, tabId)
      }
    })

    // 标签页移除事件
    chrome.tabs.onRemoved.addListener((tabId) => {
      log.debug('Tab removed', { tabId })
      // TODO: 清理相关的状态缓存
    })

    log.info('Tab event handlers setup complete')
  }

  /**
   * 通知前端标签页变化
   */
  private async notifyTabChange(url: string, tabId: number) {
    try {
      // 检查URL是否在黑名单中
      const isBlacklisted = await this.checkBlacklist(url)
      
      await sendMessage('onTabChange', {
        url,
        tabId,
        isBlacklisted
      }, `window@${tabId}`)
      
      log.debug('Tab change notified', { url, tabId, isBlacklisted })
    } catch (error) {
      log.warn('Failed to notify tab change', error)
    }
  }

  /**
   * 检查URL是否在黑名单中
   */
  private async checkBlacklist(url: string): Promise<boolean> {
    try {
      // TODO: 实现黑名单检查逻辑
      // 临时实现：检查是否为内部页面
      const internalPrefixes = ['chrome://', 'chrome-extension://', 'edge://', 'about:']
      return internalPrefixes.some(prefix => url.startsWith(prefix))
    } catch (error) {
      log.error('Blacklist check failed', error)
      return false
    }
  }

  /**
   * 获取当前活动标签页
   */
  async getCurrentTab(): Promise<chrome.tabs.Tab | null> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      return tab || null
    } catch (error) {
      log.error('Failed to get current tab', error)
      return null
    }
  }

  /**
   * 在指定标签页中执行脚本
   */
  async executeScript(tabId: number, func: () => any): Promise<any> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func
      })
      return results[0]?.result
    } catch (error) {
      log.error('Failed to execute script', { tabId, error })
      throw error
    }
  }
}
