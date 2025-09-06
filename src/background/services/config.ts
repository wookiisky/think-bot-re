/**
 * 配置管理服务
 * 负责加载、合并和提供默认配置与用户配置
 */

import { ThinkBotConfig, LLMModel, QuickInput } from '@/types/config'
import { StorageService } from './storage'
import { log } from '../utils/logger'
import defaultConfig from '@/config/default.json'
import defaultModels from '@/config/models.json'

export class ConfigService {
  private static instance: ConfigService
  private storage: StorageService
  private config: ThinkBotConfig | null = null

  private constructor() {
    this.storage = StorageService.getInstance()
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService()
    }
    return ConfigService.instance
  }

  /**
   * 初始化配置服务
   */
  async initialize(): Promise<void> {
    try {
      await this.loadConfig()
      log.info('Config service initialized')
    } catch (error) {
      log.error('Failed to initialize config service', error)
      // 使用默认配置
      await this.resetToDefault()
    }
  }

  /**
   * 加载配置
   */
  async loadConfig(): Promise<ThinkBotConfig> {
    const result = await this.storage.getConfig()
    
    if (result.success && result.data) {
      this.config = this.mergeWithDefaults(result.data)
      log.debug('Config loaded from storage')
    } else {
      log.info('No existing config found, creating default')
      this.config = this.createDefaultConfig()
      await this.saveConfig()
    }

    return this.config
  }

  /**
   * 保存配置
   */
  async saveConfig(): Promise<void> {
    if (!this.config) {
      throw new Error('No config to save')
    }

    this.config.exportedAt = new Date().toISOString()
    this.config.config.basic.lastModified = Date.now()

    const result = await this.storage.setConfig(this.config)
    if (!result.success) {
      throw new Error(result.error || 'Failed to save config')
    }

    log.info('Config saved successfully')
  }

  /**
   * 获取当前配置
   */
  getConfig(): ThinkBotConfig {
    if (!this.config) {
      throw new Error('Config not loaded')
    }
    return { ...this.config } // 返回副本
  }

  /**
   * 更新配置
   */
  async updateConfig(updates: Partial<ThinkBotConfig['config']>): Promise<void> {
    if (!this.config) {
      throw new Error('Config not loaded')
    }

    // 深度合并配置
    this.config.config = this.deepMerge(this.config.config, updates)
    await this.saveConfig()
    
    log.info('Config updated', { updates })
  }

  /**
   * 添加或更新LLM模型
   */
  async updateLLMModel(model: LLMModel): Promise<void> {
    if (!this.config) {
      throw new Error('Config not loaded')
    }

    model.lastModified = Date.now()
    const models = this.config.config.llm_models.models
    const existingIndex = models.findIndex(m => m.id === model.id)

    if (existingIndex >= 0) {
      models[existingIndex] = model
      log.info('LLM model updated', { modelId: model.id })
    } else {
      models.push(model)
      log.info('LLM model added', { modelId: model.id })
    }

    await this.saveConfig()
  }

  /**
   * 删除LLM模型
   */
  async deleteLLMModel(modelId: string): Promise<void> {
    if (!this.config) {
      throw new Error('Config not loaded')
    }

    const models = this.config.config.llm_models.models
    const index = models.findIndex(m => m.id === modelId)

    if (index >= 0) {
      models.splice(index, 1)
      await this.saveConfig()
      log.info('LLM model deleted', { modelId })
    }
  }

  /**
   * 添加或更新快捷指令
   */
  async updateQuickInput(quickInput: QuickInput): Promise<void> {
    if (!this.config) {
      throw new Error('Config not loaded')
    }

    quickInput.lastModified = Date.now()
    const quickInputs = this.config.config.quickInputs
    const existingIndex = quickInputs.findIndex(q => q.id === quickInput.id)

    if (existingIndex >= 0) {
      quickInputs[existingIndex] = quickInput
      log.info('Quick input updated', { id: quickInput.id })
    } else {
      quickInputs.push(quickInput)
      log.info('Quick input added', { id: quickInput.id })
    }

    await this.saveConfig()
  }

  /**
   * 删除快捷指令（软删除）
   */
  async deleteQuickInput(id: string): Promise<void> {
    if (!this.config) {
      throw new Error('Config not loaded')
    }

    const quickInputs = this.config.config.quickInputs
    const quickInput = quickInputs.find(q => q.id === id)

    if (quickInput) {
      quickInput.isDeleted = true
      quickInput.lastModified = Date.now()
      await this.saveConfig()
      log.info('Quick input deleted', { id })
    }
  }

  /**
   * 重置为默认配置
   */
  async resetToDefault(): Promise<void> {
    this.config = this.createDefaultConfig()
    await this.saveConfig()
    log.info('Config reset to default')
  }

  /**
   * 导出配置
   */
  exportConfig(): string {
    if (!this.config) {
      throw new Error('Config not loaded')
    }

    const exportData = {
      ...this.config,
      exportedAt: new Date().toISOString()
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 导入配置
   */
  async importConfig(configJson: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(configJson) as ThinkBotConfig
      
      // 验证配置格式
      if (!this.validateConfig(importedConfig)) {
        throw new Error('Invalid config format')
      }

      this.config = this.mergeWithDefaults(importedConfig)
      await this.saveConfig()
      
      log.info('Config imported successfully')
    } catch (error) {
      log.error('Config import failed', error)
      throw error
    }
  }

  /**
   * 创建默认配置
   */
  private createDefaultConfig(): ThinkBotConfig {
    const config = JSON.parse(JSON.stringify(defaultConfig)) as ThinkBotConfig
    
    // 添加默认模型
    config.config.llm_models.models = JSON.parse(JSON.stringify(defaultModels)) as LLMModel[]
    
    // 生成设备ID
    config.config.sync.deviceId = this.generateDeviceId()
    
    // 设置时间戳
    const now = Date.now()
    config.exportedAt = new Date().toISOString()
    config.config.basic.lastModified = now
    config.config.quickInputs.forEach(q => q.lastModified = now)
    config.config.llm_models.models.forEach(m => m.lastModified = now)

    return config
  }

  /**
   * 合并默认配置
   */
  private mergeWithDefaults(userConfig: ThinkBotConfig): ThinkBotConfig {
    const defaultCfg = this.createDefaultConfig()
    return this.deepMerge(defaultCfg, userConfig)
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target }
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    
    return result
  }

  /**
   * 验证配置格式
   */
  private validateConfig(config: any): config is ThinkBotConfig {
    return (
      config &&
      typeof config === 'object' &&
      config.config &&
      config.config.basic &&
      config.config.llm_models &&
      Array.isArray(config.config.llm_models.models) &&
      Array.isArray(config.config.quickInputs)
    )
  }

  /**
   * 生成设备ID
   */
  private generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }
}
