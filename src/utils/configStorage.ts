/**
 * @deprecated This utility is deprecated. Use StorageService from @/background/services/storage instead.
 * Chrome storage utility for configuration management
 * Uses chrome.storage.local only for reliable extension config storage
 * 
 * Migration path:
 * - Replace ConfigStorage.getInstance() with StorageService.getInstance()
 * - Use StorageService.getConfig() / setConfig() / removeConfig() methods
 * - StorageService provides automatic compression for better performance
 */

import { 
  isValidThinkBotConfig, 
  isLegacyConfigFormat, 
  transformLegacyConfig 
} from './configValidation'

import { ThinkBotConfig, StorageResult } from '@/types'

export class ConfigStorage {
  private static instance: ConfigStorage
  private readonly CONFIG_KEY = 'think_bot_config'

  private constructor() {}

  static getInstance(): ConfigStorage {
    if (!ConfigStorage.instance) {
      ConfigStorage.instance = new ConfigStorage()
    }
    return ConfigStorage.instance
  }

  /**
   * Check if chrome.storage is available and working
   */
  private async isStorageAvailable(): Promise<boolean> {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return false
      }
      
      // Test storage by trying to read/write a small test value
      const testKey = '__config_storage_test__'
      const testValue = { test: true, timestamp: Date.now() }
      
      await chrome.storage.local.set({ [testKey]: testValue })
      const result = await chrome.storage.local.get(testKey)
      await chrome.storage.local.remove(testKey)
      
      return result[testKey] && result[testKey].test === true
    } catch (error) {
      console.warn('Storage availability test failed:', error)
      return false
    }
  }

  /**
   * Get config from chrome.storage.local
   */
  async getConfig(): Promise<StorageResult<ThinkBotConfig>> {
    try {
      if (!(await this.isStorageAvailable())) {
        return {
          success: false,
          error: 'Chrome storage not available'
        }
      }

      const result = await chrome.storage.local.get(this.CONFIG_KEY)
      if (result[this.CONFIG_KEY]) {
        const storedConfig = result[this.CONFIG_KEY]
        
        console.log('Raw stored config:', storedConfig)
        
        // Validate that the stored config is an object
        if (!storedConfig || typeof storedConfig !== 'object') {
          console.error('Stored config is not an object:', storedConfig)
          return {
            success: false,
            error: 'Stored config format is invalid'
          }
        }

        // More flexible validation for different config formats
        const isValid = isValidThinkBotConfig(storedConfig)
        const isLegacy = isLegacyConfigFormat(storedConfig)
        
        if (isValid) {
          console.log('Config loaded from chrome.storage.local (valid ThinkBotConfig)')
          return {
            success: true,
            data: storedConfig as ThinkBotConfig
          }
        } else if (isLegacy) {
          console.log('Config loaded from chrome.storage.local (legacy format, will transform)')
          // Transform legacy format to current format
          const transformedConfig = transformLegacyConfig(storedConfig)
          return {
            success: true,
            data: transformedConfig
          }
        } else {
          console.error('Stored config has invalid or unknown structure:', storedConfig)
          return {
            success: false,
            error: 'Stored config has invalid structure'
          }
        }
      }

      return {
        success: false,
        error: 'No config found in chrome.storage.local'
      }
    } catch (error) {
      console.error('Failed to load config from chrome.storage.local:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Save config to chrome.storage.local
   */
  async setConfig(config: ThinkBotConfig): Promise<StorageResult<void>> {
    try {
      if (!(await this.isStorageAvailable())) {
        return {
          success: false,
          error: 'Chrome storage not available'
        }
      }

      await chrome.storage.local.set({ [this.CONFIG_KEY]: config })
      console.log('Config saved to chrome.storage.local')
      return { success: true }
    } catch (error) {
      console.error('Failed to save config to chrome.storage.local:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Remove config from chrome.storage.local
   */
  async removeConfig(): Promise<StorageResult<void>> {
    try {
      if (!(await this.isStorageAvailable())) {
        return {
          success: false,
          error: 'Chrome storage not available'
        }
      }

      await chrome.storage.local.remove(this.CONFIG_KEY)
      console.log('Config removed from chrome.storage.local')
      return { success: true }
    } catch (error) {
      console.error('Failed to remove config from chrome.storage.local:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Validation functions moved to configValidation.ts for reusability
}
