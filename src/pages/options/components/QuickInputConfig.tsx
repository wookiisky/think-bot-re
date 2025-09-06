/**
 * Quick Input Configuration Component
 * Configuration for quick input shortcuts
 */

import React, { useMemo, useEffect } from 'react'
import { useQuickInputs, useConfigStore } from '@/stores/configStore'
import { Button, FloatingLabelInput, FloatingLabelTextarea, Switch, DragHandle } from '@/components/ui'
import { DragDropGrid } from '@/components/ui/DragDropGrid'
import { OptionsCard } from '@/components/layout/OptionsLayout'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { QuickInput } from '@/types/config'

const QuickInputConfig: React.FC = () => {
  const allQuickInputs = useQuickInputs()
  const { updateQuickInputs } = useConfigStore()
  
  // Filter out deleted items with useMemo for stable reference
  const quickInputs = useMemo(() => 
    allQuickInputs.filter(input => !input.isDeleted),
    [allQuickInputs]
  )

  // Validate if quick input has required fields
  const isQuickInputValid = (quickInput: QuickInput): boolean => {
    return quickInput.displayText.trim() !== '' && quickInput.sendText.trim() !== ''
  }

  // Clean up invalid quick inputs on component unmount
  useEffect(() => {
    return () => {
      const validQuickInputs = allQuickInputs.filter(input => input.isDeleted || isQuickInputValid(input))
      if (validQuickInputs.length !== allQuickInputs.length) {
        updateQuickInputs(validQuickInputs)
      }
    }
  }, [allQuickInputs, updateQuickInputs])

  const handleAddQuickInput = () => {
    const newQuickInput: QuickInput = {
      id: crypto.randomUUID(),
      displayText: '',
      sendText: '',
      autoTrigger: false,
      lastModified: Date.now()
    }
    const updatedQuickInputs = [...allQuickInputs, newQuickInput]
    updateQuickInputs(updatedQuickInputs)
  }

  const handleDeleteQuickInput = async (quickInputId: string) => {
    if (confirm('确定要删除这个快捷指令吗？')) {
      const updatedQuickInputs = allQuickInputs.filter(item => item.id !== quickInputId)
      updateQuickInputs(updatedQuickInputs)
    }
  }

  const handleUpdateQuickInput = (quickInputId: string, updates: Partial<QuickInput>) => {
    const updatedQuickInputs = allQuickInputs.map(item => {
      if (item.id === quickInputId) {
        const updatedQuickInput = { ...item, ...updates, lastModified: Date.now() }
        // Always allow updates, validation will be done on blur or unmount
        return updatedQuickInput
      }
      return item
    })
    updateQuickInputs(updatedQuickInputs)
  }

  // Handle blur event for quick input fields to clean up incomplete items
  const handleQuickInputBlur = (quickInputId: string) => {
    const quickInput = allQuickInputs.find(qi => qi.id === quickInputId)
    if (quickInput && !isQuickInputValid(quickInput)) {
      // Remove the quick input if it's not valid and has empty required fields
      const updatedQuickInputs = allQuickInputs.filter(qi => qi.id !== quickInputId)
      updateQuickInputs(updatedQuickInputs)
    }
  }

  const handleReorderQuickInputs = (reorderedQuickInputs: QuickInput[]) => {
    // Merge reordered visible items with deleted items from original data
    const deletedItems = allQuickInputs.filter(input => input.isDeleted)
    const updatedQuickInputs = [...reorderedQuickInputs, ...deletedItems]
    updateQuickInputs(updatedQuickInputs)
  }

  const renderQuickInputCard = (quickInput: QuickInput, _index: number, dragHandle?: React.ReactNode) => (
    <QuickInputCard
      key={quickInput.id}
      quickInput={quickInput}
      dragHandle={dragHandle}
      onUpdate={(updates) => handleUpdateQuickInput(quickInput.id, updates)}
      onDelete={() => handleDeleteQuickInput(quickInput.id)}
      onBlur={() => handleQuickInputBlur(quickInput.id)}
    />
  )

  return (
    <div>
      <OptionsCard
        title="快捷指令配置"
        description="配置和管理您的快捷指令，让 AI 对话更加高效"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <p className="text-sm text-gray-600">
              您可以添加多个快捷指令，通过拖拽手柄调整显示顺序。卡片布局会根据窗口大小自适应调整。
            </p>
            <Button onClick={handleAddQuickInput}>
              <PlusIcon className="h-4 w-4 mr-2" />
              添加指令
            </Button>
          </div>

          {quickInputs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>还没有配置任何快捷指令</p>
              <p className="text-sm mt-1">点击上方按钮添加您的第一个快捷指令</p>
            </div>
          ) : (
            <DragDropGrid
              items={quickInputs}
              onItemsChange={handleReorderQuickInputs}
              renderItem={renderQuickInputCard}
            />
          )}
        </div>
      </OptionsCard>

      <OptionsCard
        title="使用说明"
        description="了解如何使用快捷指令"
      >
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">显示文本</h4>
            <p>在侧边栏中显示的按钮文本，应该简洁明了。</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">发送内容</h4>
            <p>点击快捷指令时实际发送给 AI 的内容，可以是复杂的提示词。</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">自动触发</h4>
            <p>开启后，点击指令会立即发送消息；关闭后，内容会填入输入框等待用户确认。</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">示例指令</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>总结：请帮我总结这篇文章的主要内容</li>
              <li>翻译：请将以下内容翻译成中文</li>
              <li>解释：请用通俗易懂的语言解释这个概念</li>
              <li>问答：根据以上内容回答我的问题</li>
            </ul>
          </div>
        </div>
      </OptionsCard>

    </div>
  )
}

interface QuickInputCardProps {
  quickInput: QuickInput
  dragHandle?: React.ReactNode
  onUpdate: (updates: Partial<QuickInput>) => void
  onDelete: () => void
  onBlur: () => void
}

function QuickInputCard({ quickInput, dragHandle, onUpdate, onDelete, onBlur }: QuickInputCardProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
      {/* Header with all controls */}
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div className="flex-shrink-0">
          {dragHandle || <DragHandle />}
        </div>
        
        {/* Name Input - takes remaining space */}
        <div className="flex-1 min-w-0">
          <FloatingLabelInput
            label="名称"
            value={quickInput.displayText}
            onChange={(e) => onUpdate({ displayText: e.target.value })}
            onBlur={onBlur}
            placeholder="例如：行业前辈"
          />
        </div>
        
        {/* Auto Trigger Toggle with tooltip */}
        <div className="flex-shrink-0" title="开启后打开侧边栏时会自动发送消息">
          <Switch
            checked={quickInput.autoTrigger}
            onChange={(checked) => onUpdate({ autoTrigger: checked })}
            size="sm"
          />
        </div>
        
        {/* Delete Button */}
        <div className="flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
          >
            <TrashIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <FloatingLabelTextarea
        label="消息内容"
        value={quickInput.sendText}
        onChange={(e) => onUpdate({ sendText: e.target.value })}
        onBlur={onBlur}
        rows={4}
        placeholder="=== 你的身份 ===&#10;一位在某一领域深耕多年的前辈，还记得初入行时的迷茫与不安。&#10;你既有俯瞰全局的视野，也保持着对新人困境的共情。"
      />
    </div>
  )
}

export default QuickInputConfig
