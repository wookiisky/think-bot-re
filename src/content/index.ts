/**
 * 内容脚本主入口
 * 作为后台与网页之间的桥梁
 */

import { onMessage, sendMessage } from 'webext-bridge/content-script'

class ContentScript {
  private isReady = false

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      // 等待页面完全加载
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.setupMessageListeners()
        })
      } else {
        this.setupMessageListeners()
      }

      // 页面加载完成后标记为就绪并通知后台
      if (document.readyState === 'complete') {
        this.isReady = true
        await this.notifyContentReady()
      } else {
        window.addEventListener('load', async () => {
          this.isReady = true
          await this.notifyContentReady()
        })
      }

      console.log('[ThinkBot] Content script initialized', {
        url: window.location.href,
        readyState: document.readyState
      })
    } catch (error) {
      console.error('[ThinkBot] Content script initialization failed', error)
    }
  }

  private setupMessageListeners() {
    // 获取页面HTML
    onMessage('getPageHTML', () => {
      try {
        return {
          success: true,
          data: {
            html: document.documentElement.outerHTML,
            url: window.location.href,
            title: document.title,
            readyState: document.readyState,
            isReady: this.isReady
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // 获取页面基本信息
    onMessage('getPageInfo', () => {
      try {
        const favicon = this.getFavicon()
        
        return {
          success: true,
          data: {
            url: window.location.href,
            title: document.title,
            favicon,
            readyState: document.readyState,
            isReady: this.isReady
          }
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // 检查页面就绪状态
    onMessage('checkReady', () => {
      return {
        success: true,
        data: {
          isReady: this.isReady,
          readyState: document.readyState
        }
      }
    })

    console.log('[ThinkBot] Message listeners setup complete')
  }

  /**
   * 获取页面图标
   */
  private getFavicon(): string | undefined {
    // 查找 favicon
    const linkTags = document.querySelectorAll('link[rel*="icon"]')
    
    for (const link of linkTags) {
      const href = (link as HTMLLinkElement).href
      if (href) {
        return href
      }
    }

    // 默认 favicon 路径
    const defaultFavicon = `${window.location.origin}/favicon.ico`
    return defaultFavicon
  }

  /**
   * 通知后台内容脚本已就绪
   */
  private async notifyContentReady(): Promise<void> {
    try {
      const response = await sendMessage('contentReady', {
        url: window.location.href,
        title: document.title,
        readyState: String(document.readyState), // 确保 readyState 序列化为字符串
        timestamp: Date.now(),
        favicon: this.getFavicon()
      }, 'background')
      
      console.log('[ThinkBot Content] Content ready notification sent', response)
    } catch (error) {
      console.error('[ThinkBot Content] Failed to notify content ready:', error)
    }
  }
}

// 初始化内容脚本
new ContentScript()

export {}
