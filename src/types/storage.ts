/**
 * 存储相关类型定义
 */

// 存储键值对
export interface StorageData {
  [key: string]: any
}

// 压缩数据包装
export interface CompressedData {
  compressed: string
  originalSize: number
  compressedSize: number
}

// 存储操作结果
export interface StorageResult<T = any> {
  success: boolean
  data?: T
  error?: string
}

// 存储操作类型
export type StorageOperation = 'get' | 'set' | 'remove' | 'clear'

// 存储服务配置
export interface StorageConfig {
  enableCompression: boolean
  compressionThreshold: number // 超过此字节数才压缩
  maxStorageSize: number // 最大存储限制
}

// 存储统计信息
export interface StorageStats {
  totalSize: number
  pageCount: number
  configSize: number
  compressedCount: number
  lastCleanup: number
}
