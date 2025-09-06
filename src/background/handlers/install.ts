/**
 * 扩展安装/更新事件处理器
 */

import { log } from '../utils/logger'
import { ConfigService } from '../services/config'

export class InstallHandler {
  private configService: ConfigService

  constructor() {
    this.configService = ConfigService.getInstance()
    this.setupInstallListeners()
  }

  private setupInstallListeners() {
    // 扩展安装或更新事件
    chrome.runtime.onInstalled.addListener(async (details) => {
      try {
        switch (details.reason) {
          case 'install':
            await this.handleInstall()
            break
          case 'update':
            await this.handleUpdate(details.previousVersion)
            break
          default:
            log.info('Extension reloaded')
        }
      } catch (error) {
        log.error('Failed to handle install event', error)
      }
    })

    // 扩展启动事件
    chrome.runtime.onStartup.addListener(async () => {
      try {
        await this.handleStartup()
      } catch (error) {
        log.error('Failed to handle startup event', error)
      }
    })

    log.info('Install event handlers setup complete')
  }

  /**
   * 处理首次安装
   */
  private async handleInstall() {
    log.info('Extension installed for the first time')
    
    try {
      // 初始化配置
      await this.configService.initialize()
      
      // 打开教程页面
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/pages/tutorial/index.html')
      })
      
      log.info('First-time setup completed')
    } catch (error) {
      log.error('First-time setup failed', error)
    }
  }

  /**
   * 处理扩展更新
   */
  private async handleUpdate(previousVersion?: string) {
    log.info('Extension updated', { previousVersion, currentVersion: chrome.runtime.getManifest().version })
    
    try {
      // 初始化配置（会合并新的默认配置）
      await this.configService.initialize()
      
      // TODO: 根据版本号执行迁移逻辑
      if (previousVersion) {
        await this.performMigration(previousVersion)
      }
      
      log.info('Update setup completed')
    } catch (error) {
      log.error('Update setup failed', error)
    }
  }

  /**
   * 处理扩展启动
   */
  private async handleStartup() {
    log.info('Extension started')
    
    try {
      // 初始化配置
      await this.configService.initialize()
      
      log.info('Startup completed')
    } catch (error) {
      log.error('Startup failed', error)
    }
  }

  /**
   * 执行数据迁移
   */
  private async performMigration(previousVersion: string) {
    log.info('Performing data migration', { previousVersion })
    
    try {
      const currentVersion = chrome.runtime.getManifest().version
      
      // 版本比较和迁移逻辑
      if (this.isVersionLower(previousVersion, '2.0.0')) {
        await this.migrateToV2()
      }
      
      log.info('Data migration completed', { from: previousVersion, to: currentVersion })
    } catch (error) {
      log.error('Data migration failed', error)
    }
  }

  /**
   * 迁移到 V2.0
   */
  private async migrateToV2() {
    log.info('Migrating to V2.0')
    // TODO: 实现具体的迁移逻辑
    // 例如：转换旧的数据格式、清理废弃的配置项等
  }

  /**
   * 比较版本号
   */
  private isVersionLower(version1: string, version2: string): boolean {
    const v1Parts = version1.split('.').map(Number)
    const v2Parts = version2.split('.').map(Number)
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0
      const v2Part = v2Parts[i] || 0
      
      if (v1Part < v2Part) return true
      if (v1Part > v2Part) return false
    }
    
    return false
  }
}
