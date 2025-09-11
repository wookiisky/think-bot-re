/**
 * 后台脚本主入口
 * 初始化所有服务和事件处理器
 */

import { log } from './utils/logger'
import { ConfigService } from './services/config'
import { StorageService } from './services/storage'
import { MessageHandler } from './handlers/message'
import { TabHandler } from './handlers/tab'
import { InstallHandler } from './handlers/install'

class BackgroundService {
  private configService: ConfigService
  private storageService: StorageService

  constructor() {
    this.configService = ConfigService.getInstance()
    this.storageService = StorageService.getInstance()
    // 初始化各种处理器
    new MessageHandler()
    new TabHandler()
    new InstallHandler()
  }

  async initialize() {
    try {
      log.info('Background service initializing...', {
        version: chrome.runtime.getManifest().version,
        environment: process.env.NODE_ENV
      })

      // 初始化存储服务
      await this.storageService.initialize()
      
      // 初始化配置服务
      await this.configService.initialize()
      
      // 设置侧边栏行为
      this.setupSidePanel()
      
      // 设置扩展图标点击行为
      this.setupActionHandler()

      log.info('Background service initialized successfully')
    } catch (error) {
      log.error('Background service initialization failed', error)
    }
  }

  private setupSidePanel() {
    // 启用侧边栏
    chrome.sidePanel.setPanelBehavior({ 
      openPanelOnActionClick: true 
    }).catch(error => {
      log.warn('Failed to set side panel behavior', error)
    })
  }

  private setupActionHandler() {
    // 扩展图标点击事件
    chrome.action.onClicked.addListener(async (tab) => {
      try {
        // Guard against undefined tab or missing fields
        if (!tab) {
          log.warn('No tab provided for action click')
          return
        }

        const tabId = typeof tab.id === 'number' ? tab.id : undefined
        const tabUrl = tab.url || ''

        if (!tabId || !tabUrl) {
          log.warn('Invalid tab for action click', { tabId, tabUrl })
          return
        }

        // 检查是否为受限页面
        if (this.isRestrictedUrl(tabUrl)) {
          log.info('Restricted URL detected, opening conversations page', { url: tabUrl })
          await chrome.tabs.create({
            url: chrome.runtime.getURL('src/pages/conversations/index.html')
          })
          return
        }

        // 打开侧边栏
        await chrome.sidePanel.open({ tabId })
        
        log.debug('Side panel opened', { tabId, url: tabUrl })
      } catch (error) {
        log.error('Failed to handle action click', error)
      }
    })
  }

  private isRestrictedUrl(url: string): boolean {
    const restrictedPrefixes = [
      'chrome://',
      'chrome-extension://',
      'edge://',
      'about:',
      'moz-extension://'
    ]
    
    return restrictedPrefixes.some(prefix => url.startsWith(prefix)) ||
           url.includes('chrome.google.com/webstore') ||
           url.includes('addons.mozilla.org')
  }
}

// 初始化后台服务
const backgroundService = new BackgroundService()
backgroundService.initialize()

// 确保服务实例在全局可用（用于调试）
if (process.env.NODE_ENV === 'development') {
  ;(globalThis as any).backgroundService = backgroundService
}
