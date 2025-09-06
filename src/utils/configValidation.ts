/**
 * Configuration validation utilities
 * Shared validation logic for ThinkBot configurations
 */

import type { ThinkBotConfig } from '@/types/config'

/**
 * Check if data is a valid ThinkBotConfig
 */
export function isValidThinkBotConfig(data: any): data is ThinkBotConfig {
  return data &&
         typeof data === 'object' &&
         typeof data.exportedAt === 'string' &&
         typeof data.version === 'string' &&
         typeof data.exportedBy === 'string' &&
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
 * Check if data looks like a legacy config format
 */
export function isLegacyConfigFormat(data: any): boolean {
  // Check if it's the config part without the wrapper
  if (data && typeof data === 'object') {
    // Direct config object (without wrapper)
    if (data.basic || data.llm_models || data.quickInputs || data.blacklist || data.sync) {
      return true
    }
    
    // Config with wrapper but missing some required fields
    if (data.config && typeof data.config === 'object' &&
        (data.config.basic || data.config.llm_models || data.config.quickInputs)) {
      return true
    }
  }
  
  return false
}

/**
 * Transform legacy config format to current ThinkBotConfig format
 */
export function transformLegacyConfig(legacyData: any): ThinkBotConfig {
  console.log('Transforming legacy config:', legacyData)
  
  const now = new Date().toISOString()
  const timestamp = Date.now()
  
  // If the data is already the config part (without wrapper)
  if (legacyData.basic || legacyData.llm_models || legacyData.quickInputs) {
    return {
      exportedAt: now,
      version: '2.0.0',
      exportedBy: 'ThinkBot Extension',
      config: {
        basic: legacyData.basic || {},
        llm_models: legacyData.llm_models || { models: [] },
        quickInputs: legacyData.quickInputs || [],
        blacklist: legacyData.blacklist || { patterns: [] },
        sync: legacyData.sync || { 
          enabled: false, 
          autoSync: false, 
          lastSyncTime: timestamp,
          deviceId: crypto.randomUUID()
        }
      }
    }
  }
  
  // If it has some wrapper structure but incomplete
  if (legacyData.config) {
    return {
      exportedAt: legacyData.exportedAt || now,
      version: legacyData.version || '2.0.0',
      exportedBy: legacyData.exportedBy || 'ThinkBot Extension',
      config: {
        basic: legacyData.config.basic || {},
        llm_models: legacyData.config.llm_models || { models: [] },
        quickInputs: legacyData.config.quickInputs || [],
        blacklist: legacyData.config.blacklist || { patterns: [] },
        sync: legacyData.config.sync || { 
          enabled: false, 
          autoSync: false, 
          lastSyncTime: timestamp,
          deviceId: crypto.randomUUID()
        }
      }
    }
  }
  
  // Fallback: treat as empty config with just the wrapper
  return {
    exportedAt: now,
    version: '2.0.0',
    exportedBy: 'ThinkBot Extension',
    config: {
      basic: {},
      llm_models: { models: [] },
      quickInputs: [],
      blacklist: { patterns: [] },
      sync: { 
        enabled: false, 
        autoSync: false, 
        lastSyncTime: timestamp,
        deviceId: crypto.randomUUID()
      }
    }
  }
}

/**
 * Validate config structure and provide detailed error information
 */
export function validateConfigWithDetails(data: any): { 
  isValid: boolean
  isLegacy: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!data || typeof data !== 'object') {
    errors.push('Config must be an object')
    return { isValid: false, isLegacy: false, errors }
  }
  
  // Check if it's a legacy format first
  const isLegacy = isLegacyConfigFormat(data)
  if (isLegacy) {
    return { isValid: true, isLegacy: true, errors: [] }
  }
  
  // Check current format
  if (typeof data.exportedAt !== 'string') {
    errors.push('exportedAt must be a string')
  }
  
  if (typeof data.version !== 'string') {
    errors.push('version must be a string')
  }
  
  if (typeof data.exportedBy !== 'string') {
    errors.push('exportedBy must be a string')
  }
  
  if (!data.config || typeof data.config !== 'object') {
    errors.push('config must be an object')
  } else {
    if (!data.config.basic || typeof data.config.basic !== 'object') {
      errors.push('config.basic must be an object')
    }
    
    if (!data.config.llm_models || typeof data.config.llm_models !== 'object') {
      errors.push('config.llm_models must be an object')
    } else if (!Array.isArray(data.config.llm_models.models)) {
      errors.push('config.llm_models.models must be an array')
    }
    
    if (!Array.isArray(data.config.quickInputs)) {
      errors.push('config.quickInputs must be an array')
    }
    
    if (!data.config.blacklist || typeof data.config.blacklist !== 'object') {
      errors.push('config.blacklist must be an object')
    }
    
    if (!data.config.sync || typeof data.config.sync !== 'object') {
      errors.push('config.sync must be an object')
    }
  }
  
  return { 
    isValid: errors.length === 0, 
    isLegacy: false, 
    errors 
  }
}
