/**
 * Basic Settings Component
 * Configuration for basic app settings
 */

import React from 'react'
import { useBasicConfig, useConfigStore } from '@/stores/configStore'
import { FloatingLabelInput, FloatingLabelSelect, FloatingLabelTextarea, Switch } from '@/components/ui'
import { OptionsCard } from '@/components/layout/OptionsLayout'
import type { SelectOption } from '@/components/ui'

const BasicSettings: React.FC = () => {
  const basicConfig = useBasicConfig()
  const updateBasicConfig = useConfigStore(state => state.updateBasicConfig)
  // Fix infinite loop by using separate selectors instead of creating new objects
  const isInitialized = useConfigStore(state => state.isInitialized)
  const isLoading = useConfigStore(state => state.isLoading)

  console.log('BasicSettings render - basicConfig:', basicConfig, 'isInitialized:', isInitialized, 'isLoading:', isLoading)

  if (!basicConfig) {
    const handleForceInit = () => {
      console.log('Force initializing config from UI')
      const { initializeConfig } = useConfigStore.getState()
      initializeConfig()
    }

    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 mx-auto"></div>
            <div className="space-y-3">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-500">
              正在加载配置... (初始化状态: {isInitialized ? '已完成' : '未完成'}, 
              加载状态: {isLoading ? '加载中' : '已完成'})
            </p>
            {!isLoading && !isInitialized && (
              <div className="space-y-2">
                <p className="text-sm text-red-500">配置加载超时</p>
                <button 
                  onClick={handleForceInit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  重新初始化配置
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const themeOptions: SelectOption[] = [
    { value: 'light', label: '浅色主题' },
    { value: 'dark', label: '深色主题' },
    { value: 'system', label: '跟随系统' }
  ]

  const languageOptions: SelectOption[] = [
    { value: 'zh_CN', label: '简体中文' },
    { value: 'en', label: 'English' }
  ]

  const extractionMethodOptions: SelectOption[] = [
    { value: 'readability', label: 'Readability (Mozilla)' },
    { value: 'jina', label: 'Jina Reader API' }
  ]

  return (
    <div>
      <OptionsCard
        title="界面设置"
        description="自定义界面外观和语言"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FloatingLabelSelect
            label="主题"
            options={themeOptions}
            value={basicConfig.theme}
            onChange={(value) => updateBasicConfig({ theme: value as any })}
          />
          
          <FloatingLabelSelect
            label="语言"
            options={languageOptions}
            value={basicConfig.language}
            onChange={(value) => updateBasicConfig({ language: value as any })}
          />
        </div>
      </OptionsCard>

      <OptionsCard
        title="内容提取设置"
        description="配置网页内容提取的方式和设置"
      >
        <div className="space-y-4">
          <FloatingLabelSelect
            label="默认提取方法"
            description="选择网页内容提取的默认方法"
            options={extractionMethodOptions}
            value={basicConfig.defaultExtractionMethod}
            onChange={(value) => updateBasicConfig({ defaultExtractionMethod: value as any })}
          />

          {basicConfig.defaultExtractionMethod === 'jina' && (
            <>
              <FloatingLabelInput
                label="Jina API Key"
                description="输入您的 Jina Reader API 密钥"
                type="password"
                value={basicConfig.jinaApiKey}
                onChange={(e) => updateBasicConfig({ jinaApiKey: e.target.value })}
                placeholder="输入 API 密钥"
              />
              
              <FloatingLabelInput
                label="Jina 响应模板"
                description="自定义 Jina API 的响应格式模板"
                value={basicConfig.jinaResponseTemplate || ''}
                onChange={(e) => updateBasicConfig({ jinaResponseTemplate: e.target.value })}
                placeholder="例如：markdown 格式"
              />
            </>
          )}

          <FloatingLabelInput
            label="内容显示高度"
            description="侧边栏中内容展示区域的默认高度（像素）"
            type="number"
            value={basicConfig.contentDisplayHeight}
            onChange={(e) => updateBasicConfig({ contentDisplayHeight: parseInt(e.target.value) || 300 })}
            min={200}
            max={800}
          />
        </div>
      </OptionsCard>

      <OptionsCard
        title="AI 助手设置"
        description="配置 AI 助手的基本行为"
      >
        <div className="space-y-4">
          <FloatingLabelTextarea
            label="系统提示词"
            description="系统提示词将在每次对话开始时发送给 AI，用于定制其行为和回答风格"
            rows={4}
            value={basicConfig.systemPrompt}
            onChange={(e) => updateBasicConfig({ systemPrompt: e.target.value })}
            placeholder="输入系统提示词来定制 AI 助手的行为..."
          />
        </div>
      </OptionsCard>
    </div>
  )
}

export default BasicSettings
