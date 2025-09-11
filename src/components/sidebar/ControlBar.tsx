/**
 * ControlBar Component
 * 顶部控制栏 - 页面级全局操作
 * 基于 sidebar_v2.md 文档设计
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { Select, type SelectOption } from '@/components/ui'
import { cn } from '@/utils/cn'
import { 
  useExtractionStatus, 
  usePageData, 
  useCurrentPageUrl,
  usePageDataActions, 
  useNavigationActions, 
  useClipboardActions,
  useErrorActions
} from '@/stores'
import { useBasicConfig } from '@/stores/configStore'
import type { ExtractionProvider } from '@/types'

// Material Icons
const RefreshIcon = () => (
  <span className="material-icons text-base">refresh</span>
)

const CopyIcon = () => (
  <span className="material-icons text-base">content_copy</span>
)

const DeleteIcon = () => (
  <span className="material-icons text-base">delete</span>
)

const SettingsIcon = () => (
  <span className="material-icons text-base">settings</span>
)

const ChatIcon = () => (
  <span className="material-icons text-base">chat</span>
)

interface ControlBarProps {
  className?: string
}

export const ControlBar: React.FC<ControlBarProps> = ({ className }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // 状态数据
  const pageData = usePageData()
  const currentPageUrl = useCurrentPageUrl()
  const extractionStatus = useExtractionStatus()
  const basicConfig = useBasicConfig()
  
  // 动作 hooks
  const { triggerExtraction, deletePageData } = usePageDataActions()
  const { openOptionsPage, openConversationsPage } = useNavigationActions()
  const { copyToClipboard } = useClipboardActions()
  const { lastError, clearError } = useErrorActions()

  // 提取方式选项
  const extractionOptions: SelectOption[] = [
    { value: 'readability', label: 'Readability' },
    { value: 'jina', label: 'Jina AI' }
  ]

  // 当前选中的提取方式
  const currentProvider = extractionStatus.provider || basicConfig?.defaultExtractionMethod || 'readability'

  // 是否正在提取
  const isExtracting = extractionStatus.status === 'loading'

  // 处理提取方式切换
  const handleProviderChange = async (newProvider: string | number) => {
    const provider = String(newProvider)
    if (!currentPageUrl || provider === currentProvider) return
    
    try {
      clearError()
      await triggerExtraction(currentPageUrl, provider as ExtractionProvider, false)
    } catch (error) {
      console.error('Failed to change extraction provider:', error)
    }
  }

  // 处理重新提取
  const handleReExtract = async () => {
    if (!currentPageUrl) return
    
    try {
      clearError()
      await triggerExtraction(currentPageUrl, currentProvider as ExtractionProvider, true)
    } catch (error) {
      console.error('Failed to re-extract:', error)
    }
  }

  // 处理复制提取内容
  const handleCopyContent = async () => {
    if (!pageData?.extractedContent?.contentText) {
      console.warn('No content to copy')
      return
    }

    try {
      clearError()
      const success = await copyToClipboard(pageData.extractedContent.contentText)
      if (success) {
        // TODO: 显示成功提示
        console.log('Content copied to clipboard')
      }
    } catch (error) {
      console.error('Failed to copy content:', error)
    }
  }

  // 处理删除页面数据
  const handleDeleteData = async () => {
    if (!currentPageUrl) return
    
    try {
      clearError()
      await deletePageData(currentPageUrl)
      setShowDeleteConfirm(false)
      // TODO: 显示删除成功提示
      console.log('Page data deleted')
    } catch (error) {
      console.error('Failed to delete page data:', error)
      setShowDeleteConfirm(false)
    }
  }

  // 处理打开选项页
  const handleOpenOptions = async () => {
    try {
      clearError()
      await openOptionsPage()
    } catch (error) {
      console.error('Failed to open options page:', error)
    }
  }

  // 处理打开会话页
  const handleOpenConversations = async () => {
    try {
      clearError()
      await openConversationsPage(currentPageUrl)
    } catch (error) {
      console.error('Failed to open conversations page:', error)
    }
  }

  return (
    <div className={cn(
      'flex items-center justify-between gap-2 p-3 border-b border-border bg-background',
      className
    )}>
      {/* 左侧 - 提取控制 */}
      <div className="flex items-center gap-2 flex-1">
        {/* 提取方式选择器 */}
        <Select
          options={extractionOptions}
          value={currentProvider}
          onChange={handleProviderChange}
          disabled={isExtracting}
          className="min-w-[100px]"
        />

        {/* 重新提取按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleReExtract}
          disabled={!currentPageUrl || isExtracting}
          loading={isExtracting}
          title="重新提取页面内容"
        >
          <RefreshIcon />
        </Button>

        {/* 复制内容按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyContent}
          disabled={!pageData?.extractedContent?.contentText}
          title="复制提取内容"
        >
          <CopyIcon />
        </Button>
      </div>

      {/* 右侧 - 全局操作 */}
      <div className="flex items-center gap-1">
        {/* 删除数据按钮 */}
        {!showDeleteConfirm ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={!pageData}
            title="删除页面数据"
          >
            <DeleteIcon />
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteData}
              title="确认删除"
            >
              确认
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
              title="取消删除"
            >
              取消
            </Button>
          </div>
        )}

        {/* 分隔线 */}
        <div className="w-px h-4 bg-border mx-1" />

        {/* 打开会话页按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenConversations}
          title="打开会话页面"
        >
          <ChatIcon />
        </Button>

        {/* 打开设置按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenOptions}
          title="打开设置页面"
        >
          <SettingsIcon />
        </Button>
      </div>

      {/* 错误提示 */}
      {lastError && (
        <div className="absolute top-full left-0 right-0 bg-destructive/10 border border-destructive/20 p-2 text-sm text-destructive">
          {lastError}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearError}
            className="ml-2 h-auto p-1 text-xs"
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  )
}
