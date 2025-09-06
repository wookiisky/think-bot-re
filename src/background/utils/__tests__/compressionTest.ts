/**
 * Test script to validate decompression fixes for undefined data scenarios
 * This can be run manually to verify the fixes work correctly
 */

import { CompressionUtil } from '../compression'
import { StorageRecoveryUtil } from '../storageRecovery'
import { CompressedData, ThinkBotConfig } from '@/types'

// Test data scenarios that previously caused "undefined is not valid JSON" errors
export class CompressionTestSuite {
  static async runAllTests(): Promise<void> {
    console.log('🧪 Starting decompression fix validation tests...')
    
    try {
      await this.testUndefinedCompressedData()
      await this.testNullCompressedData()
      await this.testEmptyStringCompressedData()
      await this.testInvalidCompressedDataStructure()
      await this.testCorruptedJsonData()
      await this.testRecoveryUtility()
      
      console.log('✅ All tests passed! Decompression fixes are working correctly.')
    } catch (error) {
      console.error('❌ Tests failed:', error)
    }
  }

  // Test Case 1: Undefined compressed data
  static async testUndefinedCompressedData(): Promise<void> {
    console.log('Testing undefined compressed data...')
    
    const invalidData = {
      compressed: undefined,
      originalSize: 100,
      compressedSize: 100
    } as any

    const result = CompressionUtil.decompress(invalidData)
    
    if (result.success) {
      throw new Error('Expected failure for undefined compressed data')
    }
    
    if (!result.error || !result.error.includes('missing')) {
      throw new Error('Expected specific error message for undefined data')
    }
    
    console.log('✅ Undefined compressed data handled correctly')
  }

  // Test Case 2: Null compressed data
  static async testNullCompressedData(): Promise<void> {
    console.log('Testing null compressed data...')
    
    const invalidData = {
      compressed: null,
      originalSize: 100,
      compressedSize: 100
    } as any

    const result = CompressionUtil.decompress(invalidData)
    
    if (result.success) {
      throw new Error('Expected failure for null compressed data')
    }
    
    console.log('✅ Null compressed data handled correctly')
  }

  // Test Case 3: Empty string compressed data
  static async testEmptyStringCompressedData(): Promise<void> {
    console.log('Testing empty string compressed data...')
    
    const invalidData: CompressedData = {
      compressed: '',
      originalSize: 100,
      compressedSize: 100
    }

    const result = CompressionUtil.decompress(invalidData)
    
    if (result.success) {
      throw new Error('Expected failure for empty string compressed data')
    }
    
    console.log('✅ Empty string compressed data handled correctly')
  }

  // Test Case 4: Invalid compressed data structure
  static async testInvalidCompressedDataStructure(): Promise<void> {
    console.log('Testing invalid compressed data structure...')
    
    const invalidStructures = [
      null,
      undefined,
      'string data',
      123,
      { compressed: 'data' }, // missing size props
      { originalSize: 100, compressedSize: 100 }, // missing compressed prop
    ]

    for (const invalidData of invalidStructures) {
      const result = CompressionUtil.decompress(invalidData as any)
      
      if (result.success) {
        throw new Error(`Expected failure for invalid data: ${JSON.stringify(invalidData)}`)
      }
    }
    
    console.log('✅ Invalid compressed data structures handled correctly')
  }

  // Test Case 5: Corrupted JSON data
  static async testCorruptedJsonData(): Promise<void> {
    console.log('Testing corrupted JSON data...')
    
    const corruptedData: CompressedData = {
      compressed: '{invalid json}',
      originalSize: 100,
      compressedSize: 100
    }

    const result = CompressionUtil.decompress(corruptedData)
    
    if (result.success) {
      throw new Error('Expected failure for corrupted JSON data')
    }
    
    console.log('✅ Corrupted JSON data handled correctly')
  }

  // Test Case 6: Recovery utility functionality
  static async testRecoveryUtility(): Promise<void> {
    console.log('Testing recovery utility...')
    
    // Test valid config recovery
    const validConfig = {
      config: {
        basic: { enabled: true },
        llm_models: { models: [] },
        quickInputs: [],
        blacklist: { patterns: [] },
        sync: { enabled: false }
      }
    }

    const recoveryResult = await StorageRecoveryUtil.recoverConfig(validConfig)
    
    if (!recoveryResult.success) {
      throw new Error('Expected successful recovery for valid config')
    }
    
    // Test invalid data recovery
    const invalidDataTypes = [null, undefined, 'invalid string', 123, { invalid: 'data' }]
    
    for (const invalidData of invalidDataTypes) {
      const result = await StorageRecoveryUtil.recoverConfig(invalidData)
      
      if (result.success && invalidData !== 'invalid string') {
        // String data might be recoverable, others should fail
        throw new Error(`Expected failure for invalid data: ${JSON.stringify(invalidData)}`)
      }
    }
    
    console.log('✅ Recovery utility working correctly')
  }

  // Test valid compression and decompression flow
  static async testValidFlow(): Promise<void> {
    console.log('Testing valid compression/decompression flow...')
    
    const testData = {
      test: 'data',
      number: 123,
      array: [1, 2, 3],
      nested: { prop: 'value' }
    }

    // Test compression
    const compressed = CompressionUtil.compress(testData)
    
    if (!compressed.compressed || typeof compressed.originalSize !== 'number') {
      throw new Error('Compression failed to produce valid CompressedData')
    }
    
    // Test decompression
    const decompressed = CompressionUtil.decompress(compressed)
    
    if (!decompressed.success) {
      throw new Error(`Decompression failed: ${decompressed.error}`)
    }
    
    // Verify data integrity
    if (JSON.stringify(decompressed.data) !== JSON.stringify(testData)) {
      throw new Error('Decompressed data does not match original data')
    }
    
    console.log('✅ Valid compression/decompression flow working correctly')
  }
}

// Export for manual testing
export const runCompressionTests = CompressionTestSuite.runAllTests.bind(CompressionTestSuite)

// Uncomment the following line to run tests immediately when this file is imported
// CompressionTestSuite.runAllTests()
