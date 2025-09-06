/**
 * 抽象存储服务
 * 统一的存储接口，支持压缩存储和非压缩导入导出
 */

import { StorageResult, StorageStats, CompressedData, PageData, ThinkBotConfig } from '@/types'
import { CompressionUtil } from '../utils/compression'
import { StorageRecoveryUtil } from '../utils/storageRecovery'
import { log } from '../utils/logger'

export class StorageService {
  private static instance: StorageService
  private readonly CONFIG_KEY = 'think_bot_config'
  private readonly PAGE_PREFIX = 'page_'
  private readonly STATS_KEY = 'storage_stats'

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  /**
   * Initialize storage service and clean up any corrupted data
   */
  async initialize(): Promise<void> {
    log.info('Initializing storage service')
    try {
      await StorageRecoveryUtil.cleanupCorruptedStorage()
      log.info('Storage service initialized successfully')
    } catch (error) {
      log.error('Failed to initialize storage service', error)
    }
  }

  /**
   * 存储数据（自动压缩）
   */
  async set<T>(key: string, data: T): Promise<StorageResult<void>> {
    try {
      const compressed = CompressionUtil.compress(data)
      
      await chrome.storage.local.set({
        [key]: compressed
      })

      log.debug('Data stored', { key, size: compressed.compressedSize })
      
      // 更新统计信息
      await this.updateStats()

      return { success: true }
    } catch (error) {
      log.error('Storage set failed', { key, error })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 获取数据（自动解压）
   */
  async get<T>(key: string): Promise<StorageResult<T>> {
    try {
      const result = await chrome.storage.local.get(key)
      
      if (!result[key]) {
        return {
          success: false,
          error: 'Key not found'
        }
      }

      const storedData = result[key]
      
      // Validate that stored data looks like CompressedData format
      if (!storedData || typeof storedData !== 'object') {
        log.error('Stored data is not an object', { key, storedData })
        return {
          success: false,
          error: 'Stored data format is invalid'
        }
      }

      // Check if it has required CompressedData properties
      if (!storedData.hasOwnProperty('compressed') || 
          !storedData.hasOwnProperty('originalSize') || 
          !storedData.hasOwnProperty('compressedSize')) {
        log.error('Stored data missing required CompressedData properties', { key, storedData })
        
        // Try to recover using recovery utility
        log.info('Attempting data recovery for non-CompressedData format', { key })
        const recoveryResult = await StorageRecoveryUtil.recoverConfig(storedData)
        if (recoveryResult.success) {
          log.info('Data recovered from legacy/corrupted format', { key })
          return {
            success: true,
            data: recoveryResult.data as T
          }
        }
        
        return {
          success: false,
          error: 'Unable to recover data from storage'
        }
      }

      const compressed = storedData as CompressedData
      const decompressResult = CompressionUtil.decompress<T>(compressed)

      if (!decompressResult.success) {
        log.error('Decompression failed, attempting data recovery', { key, error: decompressResult.error })
        
        // Try advanced recovery for corrupted data
        log.info('Attempting advanced data recovery', { key })
        const recoveryResult = await StorageRecoveryUtil.recoverConfig(compressed)
        if (recoveryResult.success) {
          log.info('Data recovered using recovery utility', { key })
          return {
            success: true,
            data: recoveryResult.data as T
          }
        }
        
        return decompressResult
      }

      log.debug('Data retrieved', { key })
      return {
        success: true,
        data: decompressResult.data
      }
    } catch (error) {
      log.error('Storage get failed', { key, error })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 删除数据
   */
  async remove(key: string): Promise<StorageResult<void>> {
    try {
      await chrome.storage.local.remove(key)
      log.info('Data removed', { key })
      
      // 更新统计信息
      await this.updateStats()

      return { success: true }
    } catch (error) {
      log.error('Storage remove failed', { key, error })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 获取所有页面数据的键
   */
  async getAllPageKeys(): Promise<string[]> {
    try {
      const all = await chrome.storage.local.get()
      return Object.keys(all).filter(key => key.startsWith(this.PAGE_PREFIX))
    } catch (error) {
      log.error('Failed to get page keys', error)
      return []
    }
  }

  /**
   * 存储页面数据
   */
  async setPageData(url: string, data: PageData): Promise<StorageResult<void>> {
    const key = this.PAGE_PREFIX + this.normalizeUrl(url)
    return this.set(key, data)
  }

  /**
   * 获取页面数据
   */
  async getPageData(url: string): Promise<StorageResult<PageData>> {
    const key = this.PAGE_PREFIX + this.normalizeUrl(url)
    return this.get<PageData>(key)
  }

  /**
   * 删除页面数据
   */
  async removePageData(url: string): Promise<StorageResult<void>> {
    const key = this.PAGE_PREFIX + this.normalizeUrl(url)
    return this.remove(key)
  }

  /**
   * 存储配置（压缩存储）
   */
  async setConfig(config: ThinkBotConfig): Promise<StorageResult<void>> {
    return this.set(this.CONFIG_KEY, config)
  }

  /**
   * 获取配置（自动解压）
   */
  async getConfig(): Promise<StorageResult<ThinkBotConfig>> {
    return this.get<ThinkBotConfig>(this.CONFIG_KEY)
  }

  /**
   * 导出配置（非压缩JSON，用于文件导出）
   * 返回可直接序列化的配置对象
   */
  async exportConfig(): Promise<StorageResult<ThinkBotConfig>> {
    try {
      const configResult = await this.getConfig()
      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || 'No config data available for export'
        }
      }

      // 添加导出元数据
      const exportConfig: ThinkBotConfig = {
        ...configResult.data,
        exportedAt: new Date().toISOString(),
        exportedBy: 'think-bot-re',
        version: configResult.data.version || '2.0.0'
      }

      log.info('Config prepared for export')
      return {
        success: true,
        data: exportConfig
      }
    } catch (error) {
      log.error('Config export preparation failed', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export preparation failed'
      }
    }
  }

  /**
   * 导入配置（从非压缩JSON导入，然后压缩存储）
   * 接受从JSON文件解析的配置对象
   */
  async importConfig(config: ThinkBotConfig): Promise<StorageResult<void>> {
    try {
      // 更新导入时间戳
      const importConfig: ThinkBotConfig = {
        ...config,
        exportedAt: new Date().toISOString()
      }

      const result = await this.setConfig(importConfig)
      if (result.success) {
        log.info('Config imported and stored with compression')
      }
      
      return result
    } catch (error) {
      log.error('Config import failed', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed'
      }
    }
  }

  /**
   * 清除所有数据
   */
  async clear(): Promise<StorageResult<void>> {
    try {
      await chrome.storage.local.clear()
      log.info('All storage cleared')
      return { success: true }
    } catch (error) {
      log.error('Storage clear failed', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStats(): Promise<StorageStats> {
    try {
      const all = await chrome.storage.local.get()
      const keys = Object.keys(all)
      
      let totalSize = 0
      let pageCount = 0
      let configSize = 0
      let compressedCount = 0

      for (const key of keys) {
        const data = all[key] as CompressedData
        if (data && typeof data === 'object' && 'compressedSize' in data) {
          totalSize += data.compressedSize
          if (data.compressedSize < data.originalSize) {
            compressedCount++
          }
        }

        if (key.startsWith(this.PAGE_PREFIX)) {
          pageCount++
        } else if (key === this.CONFIG_KEY) {
          configSize = data?.compressedSize || 0
        }
      }

      return {
        totalSize,
        pageCount,
        configSize,
        compressedCount,
        lastCleanup: Date.now()
      }
    } catch (error) {
      log.error('Failed to get storage stats', error)
      return {
        totalSize: 0,
        pageCount: 0,
        configSize: 0,
        compressedCount: 0,
        lastCleanup: 0
      }
    }
  }

  /**
   * 更新统计信息
   */
  private async updateStats(): Promise<void> {
    try {
      const stats = await this.getStats()
      await chrome.storage.local.set({ [this.STATS_KEY]: stats })
    } catch (error) {
      log.error('Failed to update stats', error)
    }
  }

  /**
   * URL 规范化
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url)
      // 移除 www., hash, 某些查询参数
      let normalizedHost = parsed.host.replace(/^www\./, '')
      let normalizedPath = parsed.pathname
      
      // 移除末尾的斜杠
      if (normalizedPath.endsWith('/') && normalizedPath.length > 1) {
        normalizedPath = normalizedPath.slice(0, -1)
      }

      return `${parsed.protocol}//${normalizedHost}${normalizedPath}`
    } catch (error) {
      log.warn('URL normalization failed, using original', { url, error })
      return url
    }
  }
}
