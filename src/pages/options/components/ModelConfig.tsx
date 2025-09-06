/**
 * Model Configuration Component
 * Configuration for LLM models
 */

import React, { useState, useEffect } from 'react'
import { useLLMModels, useConfigStore } from '@/stores/configStore'
import { Button, FloatingLabelInput, FloatingLabelSelect, FloatingLabelMultiSelect, Switch, DragHandle } from '@/components/ui'
import { DragDropGrid } from '@/components/ui/DragDropGrid'
import { OptionsCard } from '@/components/layout/OptionsLayout'
import { PlusIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import type { LLMModel } from '@/types/config'
import type { SelectOption, MultiSelectOption } from '@/components/ui'

const ModelConfig: React.FC = () => {
  const models = useLLMModels()
  const { removeLLMModel, updateLLMModels } = useConfigStore()

  const providerOptions: SelectOption[] = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'azure_openai', label: 'Azure OpenAI' },
    { value: 'bedrock', label: 'AWS Bedrock' }
  ]

  const toolsOptions: MultiSelectOption[] = [
    { value: 'url_context', label: 'URL Context' },
    { value: 'google_search', label: 'Google Search' },
    { value: 'web_search', label: 'Web Search' },
    { value: 'code_interpreter', label: 'Code Interpreter' },
    { value: 'file_upload', label: 'File Upload' }
  ]

  // Validate if model has required fields
  const isModelValid = (model: LLMModel): boolean => {
    return model.name.trim() !== '' && model.apiKey.trim() !== ''
  }

  // Clean up invalid models on component unmount
  useEffect(() => {
    return () => {
      const validModels = models.filter(isModelValid)
      if (validModels.length !== models.length) {
        updateLLMModels(validModels)
      }
    }
  }, [models, updateLLMModels])

  const handleAddModel = () => {
    const newModel: LLMModel = {
      id: crypto.randomUUID(),
      name: '',
      provider: 'openai',
      enabled: true,
      lastModified: Date.now(),
      apiKey: '',
      baseUrl: '',
      maxTokens: 65500,
      model: '',
      temperature: 0.7,
      tools: []
    }
    const updatedModels = [...models, newModel]
    updateLLMModels(updatedModels)
  }

  const handleDeleteModel = async (modelId: string) => {
    if (confirm('确定要删除这个模型吗？')) {
      await removeLLMModel(modelId)
    }
  }

  const handleUpdateModel = (modelId: string, updates: Partial<LLMModel>) => {
    const updatedModels = models.map(model => {
      if (model.id === modelId) {
        const updatedModel = { ...model, ...updates, lastModified: Date.now() }
        // Always allow updates, validation will be done on blur or unmount
        return updatedModel
      }
      return model
    })
    updateLLMModels(updatedModels)
  }

  // Handle blur event for model fields to clean up incomplete models
  const handleModelBlur = (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (model && !isModelValid(model)) {
      // Remove the model if it's not valid and has empty required fields
      const updatedModels = models.filter(m => m.id !== modelId)
      updateLLMModels(updatedModels)
    }
  }

  const handleReorderModels = (reorderedModels: LLMModel[]) => {
    updateLLMModels(reorderedModels)
  }

  const renderModelCard = (model: LLMModel, _index: number, dragHandle?: React.ReactNode) => (
    <ModelCard
      key={model.id}
      model={model}
      dragHandle={dragHandle}
      onUpdate={(updates) => handleUpdateModel(model.id, updates)}
      onDelete={() => handleDeleteModel(model.id)}
      onBlur={() => handleModelBlur(model.id)}
      providerOptions={providerOptions}
      toolsOptions={toolsOptions}
    />
  )

  return (
    <div>
      <OptionsCard
        title="语言模型配置"
        description="配置和管理您的 AI 语言模型"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <p className="text-sm text-gray-600">
              您可以添加多个模型，通过拖拽手柄调整优先级顺序。卡片布局会根据窗口大小自适应调整。
            </p>
            <Button onClick={handleAddModel}>
              <PlusIcon className="h-4 w-4 mr-2" />
              添加模型
            </Button>
          </div>

          {models.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>还没有配置任何模型</p>
              <p className="text-sm mt-1">点击上方按钮添加您的第一个模型</p>
            </div>
          ) : (
            <DragDropGrid
              items={models}
              onItemsChange={handleReorderModels}
              renderItem={renderModelCard}
            />
          )}
        </div>
      </OptionsCard>
    </div>
  )
}

interface ModelCardProps {
  model: LLMModel
  dragHandle?: React.ReactNode
  onUpdate: (updates: Partial<LLMModel>) => void
  onDelete: () => void
  onBlur: () => void
  providerOptions: SelectOption[]
  toolsOptions: MultiSelectOption[]
}

function ModelCard({ model, dragHandle, onUpdate, onDelete, onBlur, providerOptions, toolsOptions }: ModelCardProps) {
  const [showApiKey, setShowApiKey] = useState(false)
  const [thinkingBudget, setThinkingBudget] = useState(model.thinkingBudget || -1)

  const isAzure = model.provider === 'azure_openai'

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
      {/* Header with drag handle and delete button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {dragHandle || <DragHandle />}
          <Switch
            checked={model.enabled}
            onChange={(checked) => onUpdate({ enabled: checked })}
            label=""
          />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
        >
          <TrashIcon className="h-3 w-3" />
        </Button>
      </div>

      {/* Name and Provider */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FloatingLabelInput
          label="显示名称"
          value={model.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          onBlur={onBlur}
          placeholder="例如：GPro"
        />
        
        <FloatingLabelSelect
          label="服务提供商"
          options={providerOptions}
          value={model.provider}
          onChange={(value) => onUpdate({ provider: value as any })}
        />
      </div>

      {/* Service URL */}
      <FloatingLabelInput
        label="服务 URL"
        value={model.baseUrl}
        onChange={(e) => onUpdate({ baseUrl: e.target.value })}
        placeholder="http://www.366400.xyz:42143"
      />

      {/* API Key */}
      <FloatingLabelInput
        label="API 密钥"
        type={showApiKey ? "text" : "password"}
        value={model.apiKey}
        onChange={(e) => onUpdate({ apiKey: e.target.value })}
        onBlur={onBlur}
        endIcon={
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showApiKey ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        }
      />

      {/* Model */}
      <FloatingLabelInput
        label="模型"
        value={model.model}
        onChange={(e) => onUpdate({ model: e.target.value })}
        placeholder="gemini-2.5-pro"
      />

      {/* Tools */}
      <FloatingLabelMultiSelect
        label="Tools"
        options={toolsOptions}
        value={model.tools || []}
        onChange={(tools) => onUpdate({ tools: tools.map(String) })}
      />

      {/* Advanced Settings */}
      <div className="border-t border-gray-300 pt-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FloatingLabelInput
            label="Thinking Budget"
            type="number"
            value={thinkingBudget}
            onChange={(e) => {
              const value = parseInt(e.target.value) || -1
              setThinkingBudget(value)
              onUpdate({ thinkingBudget: value })
            }}
            placeholder="-1"
          />
          
          <FloatingLabelInput
            label="最大 token 数"
            type="number"
            value={model.maxTokens}
            onChange={(e) => onUpdate({ maxTokens: parseInt(e.target.value) || 65500 })}
            placeholder="65500"
            min={1}
            max={200000}
          />
          
          <FloatingLabelInput
            label="温度"
            type="number"
            step="0.1"
            value={model.temperature}
            onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) || 0.7 })}
            placeholder="0.7"
            min={0}
            max={2}
            description="控制回复的随机性"
          />
        </div>
      </div>

      {/* Azure specific fields */}
      {isAzure && (
        <div className="border-t border-gray-300 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FloatingLabelInput
              label="API 版本"
              value={model.apiVersion || ''}
              onChange={(e) => onUpdate({ apiVersion: e.target.value })}
              description="Azure API 版本"
            />
            
            <FloatingLabelInput
              label="部署名称"
              value={model.deploymentName || ''}
              onChange={(e) => onUpdate({ deploymentName: e.target.value })}
              description="Azure 部署名称"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ModelConfig
