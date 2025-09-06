/**
 * Import/Export Component
 * Configuration import and export functionality
 */

import React, { useState, useRef } from 'react'
import { useConfig, useConfigStore } from '@/stores/configStore'
import { Button } from '@/components/ui'
import { OptionsCard } from '@/components/layout/OptionsLayout'
import { 
  DocumentArrowDownIcon, 
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { isValidThinkBotConfig, validateConfigWithDetails } from '@/utils/configValidation'
import type { ThinkBotConfig } from '@/types/config'

const ImportExport: React.FC = () => {
  const config = useConfig()
  const { updateConfig, resetConfig } = useConfigStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleExport = async () => {
    if (!config) {
      alert('配置数据未加载，请稍后再试')
      return
    }

    setIsExporting(true)
    try {
      // Create export data with updated metadata
      const exportData: ThinkBotConfig = {
        ...config,
        exportedAt: new Date().toISOString(),
        exportedBy: 'think-bot-re',
        version: config.version || '2.0.0'
      }

      // Create and download file (non-compressed JSON for user readability)
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `think-bot-config-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('Config exported successfully as non-compressed JSON')
      setImportResult({
        type: 'success',
        message: '配置已成功导出'
      })
    } catch (error) {
      console.error('Export failed:', error)
      setImportResult({
        type: 'error',
        message: '导出失败：' + (error instanceof Error ? error.message : '未知错误')
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.json')) {
      setImportResult({
        type: 'error',
        message: '请选择 JSON 格式的配置文件'
      })
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const fileContent = await file.text()
      const importedConfig = JSON.parse(fileContent) as ThinkBotConfig

      // Validate config structure with detailed error information
      const validation = validateConfigWithDetails(importedConfig)
      if (!validation.isValid && !validation.isLegacy) {
        throw new Error(`配置文件格式不正确: ${validation.errors.join(', ')}`)
      }
      
      // Use direct validation for legacy handling (handled in StorageService)
      if (!isValidThinkBotConfig(importedConfig) && !validation.isLegacy) {
        throw new Error('配置文件格式不正确')
      }

      // Update config (will be compressed and stored via StorageService)
      await updateConfig(importedConfig)

      console.log('Config imported successfully and stored with compression')
      setImportResult({
        type: 'success',
        message: '配置已成功导入并应用'
      })
    } catch (error) {
      console.error('Import failed:', error)
      setImportResult({
        type: 'error',
        message: '导入失败：' + (error instanceof Error ? error.message : '未知错误')
      })
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }


  const handleReset = async () => {
    if (confirm('确定要重置所有配置到默认值吗？此操作不可撤销！')) {
      try {
        await resetConfig()
        setImportResult({
          type: 'success',
          message: '配置已重置为默认值'
        })
      } catch (error) {
        setImportResult({
          type: 'error',
          message: '重置失败：' + (error instanceof Error ? error.message : '未知错误')
        })
      }
    }
  }

  const clearResult = () => {
    setImportResult(null)
  }

  return (
    <div>
      <OptionsCard
        title="配置导出"
        description="将当前配置导出为 JSON 文件，可用于备份或在其他设备上导入"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            导出的配置文件包含：语言模型设置、快捷指令、基础配置、黑名单规则等所有设置信息。
          </p>
          
          <Button 
            onClick={handleExport}
            loading={isExporting}
            className="w-full sm:w-auto"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            {isExporting ? '正在导出...' : '导出配置'}
          </Button>
        </div>
      </OptionsCard>

      <OptionsCard
        title="配置导入"
        description="从 JSON 文件导入配置，将覆盖当前所有设置"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">注意</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  导入配置将完全覆盖当前设置，建议先导出当前配置作为备份。
                </p>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button 
            onClick={handleImportClick}
            loading={isImporting}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            {isImporting ? '正在导入...' : '选择配置文件'}
          </Button>
        </div>
      </OptionsCard>

      <OptionsCard
        title="重置配置"
        description="将所有设置恢复到默认值"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-red-800">危险操作</h4>
                <p className="text-sm text-red-700 mt-1">
                  此操作将删除所有自定义配置，包括模型设置、快捷指令等，且不可撤销。
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleReset}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            重置所有配置
          </Button>
        </div>
      </OptionsCard>

      {/* Result notification */}
      {importResult && (
        <div className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-lg ${
          importResult.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            {importResult.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5 mr-3" />
            ) : (
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                importResult.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {importResult.type === 'success' ? '操作成功' : '操作失败'}
              </p>
              <p className={`text-sm mt-1 ${
                importResult.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {importResult.message}
              </p>
            </div>
            <button
              onClick={clearResult}
              className={`ml-3 text-sm ${
                importResult.type === 'success' ? 'text-green-600' : 'text-red-600'
              } hover:opacity-75`}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportExport
