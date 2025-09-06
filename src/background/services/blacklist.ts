/**
 * Blacklist Service
 * Manages website blacklist patterns and matching logic
 */

import { BlacklistPattern, BlacklistConfig } from '@/types/config'
import { StorageService } from './storage'
import { log } from '../utils/logger'

export class BlacklistService {
  private static instance: BlacklistService
  private storage: StorageService
  private patterns: BlacklistPattern[] = []

  private constructor() {
    this.storage = StorageService.getInstance()
  }

  static getInstance(): BlacklistService {
    if (!BlacklistService.instance) {
      BlacklistService.instance = new BlacklistService()
    }
    return BlacklistService.instance
  }

  /**
   * Initialize blacklist service
   */
  async initialize(): Promise<void> {
    try {
      await this.loadPatterns()
      log.info('Blacklist service initialized')
    } catch (error) {
      log.error('Failed to initialize blacklist service', error)
      this.patterns = []
    }
  }

  /**
   * Load blacklist patterns from storage
   */
  private async loadPatterns(): Promise<void> {
    try {
      const configResult = await this.storage.getConfig()
      if (configResult.success && configResult.data?.config?.blacklist) {
        this.patterns = configResult.data.config.blacklist.patterns || []
        log.debug('Blacklist patterns loaded', { count: this.patterns.length })
      }
    } catch (error) {
      log.error('Failed to load blacklist patterns', error)
      this.patterns = []
    }
  }

  /**
   * Check if a URL matches any blacklist pattern
   */
  isBlacklisted(url: string): boolean {
    if (!url || this.patterns.length === 0) {
      return false
    }

    try {
      // Get enabled patterns only
      const enabledPatterns = this.patterns.filter(p => p.enabled)
      
      for (const pattern of enabledPatterns) {
        if (this.matchesPattern(url, pattern.pattern)) {
          log.debug('URL matched blacklist pattern', { url, pattern: pattern.pattern })
          return true
        }
      }
      
      return false
    } catch (error) {
      log.error('Error checking blacklist', { url, error })
      return false
    }
  }

  /**
   * Check if URL matches a specific pattern
   */
  private matchesPattern(url: string, pattern: string): boolean {
    try {
      // Normalize the URL for comparison
      const normalizedUrl = this.normalizeUrl(url)
      
      // Handle different pattern types
      if (pattern.includes('*') || pattern.includes('?')) {
        // Wildcard pattern - convert to regex
        const regexPattern = this.wildcardToRegex(pattern)
        return new RegExp(regexPattern, 'i').test(normalizedUrl)
      } else if (pattern.startsWith('/') && pattern.endsWith('/')) {
        // Regex pattern
        const regexStr = pattern.slice(1, -1)
        return new RegExp(regexStr, 'i').test(normalizedUrl)
      } else {
        // Exact domain/URL match
        return this.matchesDomain(normalizedUrl, pattern)
      }
    } catch (error) {
      log.warn('Pattern matching error', { url, pattern, error })
      return false
    }
  }

  /**
   * Convert wildcard pattern to regex
   */
  private wildcardToRegex(pattern: string): string {
    // Escape special regex characters except * and ?
    let escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    
    // Convert wildcards to regex
    escaped = escaped.replace(/\*/g, '.*')
    escaped = escaped.replace(/\?/g, '.')
    
    // Add anchors
    return `^${escaped}$`
  }

  /**
   * Check if URL matches domain pattern
   */
  private matchesDomain(url: string, pattern: string): boolean {
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname
      
      // Exact domain match
      if (domain === pattern) {
        return true
      }
      
      // Check if pattern is a subdomain wildcard (e.g., *.example.com)
      if (pattern.startsWith('*.')) {
        const baseDomain = pattern.substring(2)
        return domain === baseDomain || domain.endsWith('.' + baseDomain)
      }
      
      // Check if URL contains the pattern as substring
      return url.toLowerCase().includes(pattern.toLowerCase())
    } catch (error) {
      log.warn('Domain matching error', { url, pattern, error })
      return false
    }
  }

  /**
   * Normalize URL for consistent matching
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      // Remove trailing slash, convert to lowercase
      let normalized = `${urlObj.protocol}//${urlObj.hostname}`
      
      if (urlObj.port && 
          !((urlObj.protocol === 'http:' && urlObj.port === '80') ||
            (urlObj.protocol === 'https:' && urlObj.port === '443'))) {
        normalized += `:${urlObj.port}`
      }
      
      if (urlObj.pathname !== '/') {
        normalized += urlObj.pathname.replace(/\/$/, '')
      }
      
      if (urlObj.search) {
        normalized += urlObj.search
      }
      
      return normalized.toLowerCase()
    } catch (error) {
      // If URL parsing fails, return original URL
      return url.toLowerCase()
    }
  }

  /**
   * Add a new blacklist pattern
   */
  async addPattern(pattern: string, enabled: boolean = true): Promise<void> {
    try {
      const newPattern: BlacklistPattern = {
        id: crypto.randomUUID(),
        pattern: pattern.trim(),
        enabled
      }

      this.patterns.push(newPattern)
      await this.savePatterns()
      
      log.info('Blacklist pattern added', { pattern: newPattern.pattern })
    } catch (error) {
      log.error('Failed to add blacklist pattern', { pattern, error })
      throw error
    }
  }

  /**
   * Remove a blacklist pattern
   */
  async removePattern(patternId: string): Promise<void> {
    try {
      const index = this.patterns.findIndex(p => p.id === patternId)
      if (index >= 0) {
        const removedPattern = this.patterns.splice(index, 1)[0]
        await this.savePatterns()
        
        log.info('Blacklist pattern removed', { pattern: removedPattern.pattern })
      }
    } catch (error) {
      log.error('Failed to remove blacklist pattern', { patternId, error })
      throw error
    }
  }

  /**
   * Update a blacklist pattern
   */
  async updatePattern(patternId: string, updates: Partial<BlacklistPattern>): Promise<void> {
    try {
      const pattern = this.patterns.find(p => p.id === patternId)
      if (pattern) {
        Object.assign(pattern, updates)
        await this.savePatterns()
        
        log.info('Blacklist pattern updated', { patternId, updates })
      }
    } catch (error) {
      log.error('Failed to update blacklist pattern', { patternId, error })
      throw error
    }
  }

  /**
   * Get all blacklist patterns
   */
  getPatterns(): BlacklistPattern[] {
    return [...this.patterns]
  }

  /**
   * Get enabled patterns only
   */
  getEnabledPatterns(): BlacklistPattern[] {
    return this.patterns.filter(p => p.enabled)
  }

  /**
   * Save patterns to storage
   */
  private async savePatterns(): Promise<void> {
    try {
      // Get current config
      const configResult = await this.storage.getConfig()
      if (!configResult.success || !configResult.data) {
        throw new Error('Failed to get current config')
      }

      // Update blacklist patterns
      const updatedConfig = {
        ...configResult.data,
        config: {
          ...configResult.data.config,
          blacklist: {
            patterns: this.patterns
          }
        }
      }

      // Save updated config
      const saveResult = await this.storage.setConfig(updatedConfig)
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save patterns')
      }

      log.debug('Blacklist patterns saved', { count: this.patterns.length })
    } catch (error) {
      log.error('Failed to save blacklist patterns', error)
      throw error
    }
  }

  /**
   * Refresh patterns from storage
   */
  async refresh(): Promise<void> {
    await this.loadPatterns()
  }

  /**
   * Clear all patterns
   */
  async clearAll(): Promise<void> {
    try {
      this.patterns = []
      await this.savePatterns()
      log.info('All blacklist patterns cleared')
    } catch (error) {
      log.error('Failed to clear blacklist patterns', error)
      throw error
    }
  }
}
