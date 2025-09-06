/**
 * Storage recovery utility for handling corrupted or malformed storage data
 */

import { ThinkBotConfig, StorageResult, CompressedData } from '@/types'
import { CompressionUtil } from './compression'
import { log } from './logger'

export class StorageRecoveryUtil {
  /**
   * Attempt to recover config from potentially corrupted storage data
   */
  static async recoverConfig(corruptedData: any): Promise<StorageResult<ThinkBotConfig>> {
    log.info('Attempting storage data recovery', { dataType: typeof corruptedData })

    try {
      // Case 1: Data is null or undefined
      if (corruptedData === null || corruptedData === undefined) {
        return {
          success: false,
          error: 'No data to recover'
        }
      }

      // Case 2: Data is a string - might be JSON
      if (typeof corruptedData === 'string') {
        try {
          const parsed = JSON.parse(corruptedData)
          if (this.isValidConfig(parsed)) {
            log.info('Recovered config from JSON string')
            return { success: true, data: parsed }
          }
        } catch (parseError) {
          log.error('Failed to parse string data as JSON', parseError)
        }
      }

      // Case 3: Data is already an object - check if it's valid config
      if (typeof corruptedData === 'object' && corruptedData !== null) {
        // Direct config object
        if (this.isValidConfig(corruptedData)) {
          log.info('Data is already a valid config object')
          return { success: true, data: corruptedData }
        }

        // Might be CompressedData format
        if (this.looksLikeCompressedData(corruptedData)) {
          try {
            const decompressResult = CompressionUtil.decompress<ThinkBotConfig>(corruptedData)
            if (decompressResult.success && this.isValidConfig(decompressResult.data)) {
              log.info('Recovered config from compressed data')
              return { success: true, data: decompressResult.data }
            }
          } catch (decompressionError) {
            log.error('Failed to decompress data during recovery', decompressionError)
          }

          // If decompression failed, try to extract raw data
          if (corruptedData.compressed && typeof corruptedData.compressed === 'string') {
            try {
              const rawData = JSON.parse(corruptedData.compressed)
              if (this.isValidConfig(rawData)) {
                log.info('Recovered config from compressed string data')
                return { success: true, data: rawData }
              }
            } catch (rawParseError) {
              log.error('Failed to parse compressed string data', rawParseError)
            }
          }
        }

        // Try to extract config from nested structure
        if (corruptedData.config && this.isValidPartialConfig(corruptedData.config)) {
          log.info('Found partial config in nested structure')
          return {
            success: true,
            data: corruptedData as ThinkBotConfig
          }
        }
      }

      log.error('Unable to recover config from corrupted data', { corruptedData })
      return {
        success: false,
        error: 'Unable to recover config from corrupted data'
      }
    } catch (error) {
      log.error('Storage recovery failed with error', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Recovery failed'
      }
    }
  }

  /**
   * Check if data looks like CompressedData format
   */
  private static looksLikeCompressedData(data: any): data is CompressedData {
    return data &&
           typeof data === 'object' &&
           typeof data.compressed === 'string' &&
           typeof data.originalSize === 'number' &&
           typeof data.compressedSize === 'number'
  }

  /**
   * Basic validation to check if object looks like a valid ThinkBotConfig
   */
  private static isValidConfig(data: any): data is ThinkBotConfig {
    return data &&
           typeof data === 'object' &&
           data.config &&
           typeof data.config === 'object' &&
           data.config.basic &&
           typeof data.config.basic === 'object' &&
           data.config.llm_models &&
           typeof data.config.llm_models === 'object' &&
           Array.isArray(data.config.llm_models.models) &&
           Array.isArray(data.config.quickInputs) &&
           data.config.blacklist &&
           typeof data.config.blacklist === 'object' &&
           data.config.sync &&
           typeof data.config.sync === 'object'
  }

  /**
   * Check if data has some config-like properties (partial validation)
   */
  private static isValidPartialConfig(data: any): boolean {
    return data &&
           typeof data === 'object' &&
           (data.basic || data.llm_models || data.quickInputs || data.blacklist || data.sync)
  }

  /**
   * Clean up corrupted storage entries
   */
  static async cleanupCorruptedStorage(): Promise<void> {
    try {
      // Get all storage data
      const allData = await chrome.storage.local.get(null)
      const keysToRemove: string[] = []

      for (const [key, value] of Object.entries(allData)) {
        // Skip non-ThinkBot keys
        if (!key.startsWith('think_bot') && !key.startsWith('page_')) {
          continue
        }

        // Check if value is corrupted
        if (this.isDataCorrupted(value)) {
          log.warn('Found corrupted storage entry', { key })
          keysToRemove.push(key)
        }
      }

      // Remove corrupted entries
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove)
        log.info('Cleaned up corrupted storage entries', { removedKeys: keysToRemove })
      }
    } catch (error) {
      log.error('Storage cleanup failed', error)
    }
  }

  /**
   * Check if data appears to be corrupted
   */
  private static isDataCorrupted(data: any): boolean {
    // Null or undefined data
    if (data === null || data === undefined) {
      return true
    }

    // Empty string or objects
    if ((typeof data === 'string' && data.trim() === '') ||
        (typeof data === 'object' && Object.keys(data).length === 0)) {
      return true
    }

    // Invalid compressed data structure
    if (data && typeof data === 'object' && 
        data.hasOwnProperty('compressed') &&
        (data.compressed === null || data.compressed === undefined || 
         typeof data.originalSize !== 'number' || 
         typeof data.compressedSize !== 'number')) {
      return true
    }

    return false
  }
}
