/**
 * 数据压缩工具
 * 使用 pako 进行 gzip 压缩/解压
 */

import * as pako from 'pako'
import { CompressedData, StorageResult } from '@/types'
import { log } from './logger'

export class CompressionUtil {
  private static readonly COMPRESSION_THRESHOLD = 1024 // 1KB 以上才压缩

  /**
   * 压缩数据
   */
  static compress(data: any): CompressedData {
    try {
      const jsonString = JSON.stringify(data)
      const originalSize = new Blob([jsonString]).size

      // 小于阈值不压缩
      if (originalSize < this.COMPRESSION_THRESHOLD) {
        return {
          compressed: jsonString,
          originalSize,
          compressedSize: originalSize
        }
      }

      const compressed = pako.gzip(jsonString, { level: 6 })
      const compressedString = btoa(String.fromCharCode(...compressed))
      const compressedSize = new Blob([compressedString]).size

      log.debug('Data compressed', {
        originalSize,
        compressedSize,
        ratio: (compressedSize / originalSize * 100).toFixed(2) + '%'
      })

      return {
        compressed: compressedString,
        originalSize,
        compressedSize
      }
    } catch (error) {
      log.error('Compression failed', error)
      throw new Error('Failed to compress data')
    }
  }

  /**
   * 解压数据
   */
  static decompress<T = any>(compressedData: CompressedData): StorageResult<T> {
    try {
      // Validate input data
      if (!compressedData || typeof compressedData !== 'object') {
        log.error('Invalid compressedData: not an object', compressedData)
        return {
          success: false,
          error: 'Invalid compressed data format'
        }
      }

      const { compressed } = compressedData

      // Validate compressed string
      if (compressed === undefined || compressed === null) {
        log.error('Compressed data is undefined or null', compressedData)
        return {
          success: false,
          error: 'Compressed data is missing'
        }
      }

      if (typeof compressed !== 'string') {
        log.error('Compressed data is not a string', { type: typeof compressed, compressedData })
        return {
          success: false,
          error: 'Compressed data must be a string'
        }
      }

      if (compressed.trim() === '') {
        log.error('Compressed data is empty string', compressedData)
        return {
          success: false,
          error: 'Compressed data is empty'
        }
      }

      // Validate size properties
      if (typeof compressedData.originalSize !== 'number' || typeof compressedData.compressedSize !== 'number') {
        log.error('Invalid size properties', compressedData)
        return {
          success: false,
          error: 'Invalid size properties in compressed data'
        }
      }

      // 检查是否真的是压缩数据
      if (compressedData.originalSize === compressedData.compressedSize) {
        // 未压缩的数据
        try {
          const data = JSON.parse(compressed)
          return {
            success: true,
            data
          }
        } catch (jsonError) {
          log.error('Failed to parse uncompressed JSON data', { compressed, error: jsonError })
          return {
            success: false,
            error: 'Failed to parse uncompressed JSON data'
          }
        }
      }

      // 解压数据
      try {
        const binaryString = atob(compressed)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        const decompressed = pako.ungzip(bytes, { to: 'string' })
        
        // Validate decompressed result
        if (!decompressed || typeof decompressed !== 'string' || decompressed.trim() === '') {
          log.error('Decompression result is invalid', { decompressed })
          return {
            success: false,
            error: 'Decompression produced invalid result'
          }
        }

        const data = JSON.parse(decompressed)

        log.debug('Data decompressed', {
          originalSize: compressedData.originalSize,
          compressedSize: compressedData.compressedSize
        })

        return {
          success: true,
          data
        }
      } catch (decompressionError) {
        log.error('Decompression or JSON parsing failed', { compressed, error: decompressionError })
        return {
          success: false,
          error: 'Failed to decompress or parse data'
        }
      }
    } catch (error) {
      log.error('Decompression failed', error)
      return {
        success: false,
        error: 'Failed to decompress data'
      }
    }
  }

  /**
   * 检查数据是否需要压缩
   */
  static shouldCompress(data: any): boolean {
    const jsonString = JSON.stringify(data)
    const size = new Blob([jsonString]).size
    return size >= this.COMPRESSION_THRESHOLD
  }

  /**
   * 获取数据大小（字节）
   */
  static getDataSize(data: any): number {
    const jsonString = JSON.stringify(data)
    return new Blob([jsonString]).size
  }
}
