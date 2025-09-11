/**
 * ContentArea Component
 * 内容展示区 - 显示提取的正文，处理加载/错误状态，响应高度拖拽
 * 基于 sidebar_v2.md 文档设计
 */

import React, { useRef, useCallback, useEffect } from 'react'
import { cn } from '@/utils/cn'
import { ResizeHandle } from '@/components/ui'
import { 
  usePageData, 
  useExtractionStatus,
  useContentPanelHeight,
  useSidebarUiStore
} from '@/stores'

// Material Icons
const ErrorIcon = () => (
  <span className="material-icons text-lg text-destructive">error</span>
)

const LoadingIcon = () => (
  <span className="material-icons text-lg animate-spin">refresh</span>
)

const ContentIcon = () => (
  <span className="material-icons text-lg text-muted-foreground">article</span>
)

interface ContentAreaProps {
  className?: string
}

export const ContentArea: React.FC<ContentAreaProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // 状态数据
  const pageData = usePageData()
  const extractionStatus = useExtractionStatus()
  const contentPanelHeight = useContentPanelHeight()
  const { setContentPanelHeight } = useSidebarUiStore()

  // 提取的内容数据
  const extractedContent = pageData?.extractedContent

  // 拖拽调整高度的处理
  const handleHeightChange = useCallback((newHeight: number) => {
    // 限制高度范围：100px 到 600px
    const clampedHeight = Math.max(100, Math.min(newHeight, 600))
    setContentPanelHeight(clampedHeight)
  }, [setContentPanelHeight])

  // 渲染加载状态
  const renderLoadingState = () => {
    const stage = extractionStatus.stage || 'idle'
    const stageMessages = {
      idle: '准备提取...',
      requesting_html: '获取页面 HTML...',
      parsing: '解析页面内容...',
      persisting: '保存提取结果...',
      completed: '提取完成',
      error: '提取失败'
    }

    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
        <LoadingIcon />
        <div className="text-sm font-medium">
          {stageMessages[stage]}
        </div>
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-orange-400 animate-pulse rounded-full" />
        </div>
      </div>
    )
  }

  // 渲染错误状态
  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-destructive">
      <ErrorIcon />
      <div className="text-sm font-medium">内容提取失败</div>
      {extractionStatus.error && (
        <div className="text-xs text-muted-foreground max-w-full truncate">
          {extractionStatus.error}
        </div>
      )}
    </div>
  )

  // 渲染内容
  const renderContent = () => {
    if (!extractedContent) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
          <ContentIcon />
          <div className="text-sm">暂无提取内容</div>
        </div>
      )
    }

    return (
      <div 
        ref={contentRef}
        className="h-full overflow-auto p-4 prose prose-sm max-w-none
                   prose-headings:text-foreground 
                   prose-p:text-foreground 
                   prose-strong:text-foreground
                   prose-code:text-foreground
                   prose-pre:bg-muted
                   prose-blockquote:border-l-border
                   prose-blockquote:text-muted-foreground"
      >
        {/* 页面标题 */}
        {extractedContent.meta?.title && (
          <h1 className="text-lg font-semibold mb-3 pb-2 border-b border-border">
            {extractedContent.meta.title}
          </h1>
        )}

        {/* 作者信息 */}
        {extractedContent.meta?.byline && (
          <p className="text-sm text-muted-foreground mb-4">
            {extractedContent.meta.byline}
          </p>
        )}

        {/* 主要内容 */}
        <div className="content-text">
          {extractedContent.contentMarkdown ? (
            // 如果有 Markdown 格式，渲染 Markdown (这里暂时显示纯文本)
            <div className="whitespace-pre-wrap break-words">
              {extractedContent.contentText}
            </div>
          ) : (
            // 纯文本内容
            <div className="whitespace-pre-wrap break-words">
              {extractedContent.contentText}
            </div>
          )}
        </div>

        {/* 提取信息 */}
        <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>提取方式: {extractedContent.provider}</span>
            <span>{new Date(extractedContent.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    )
  }

  // 根据状态决定渲染内容
  const renderBody = () => {
    if (extractionStatus.status === 'loading') {
      return renderLoadingState()
    }
    
    if (extractionStatus.status === 'error') {
      return renderErrorState()
    }
    
    return renderContent()
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative border border-border rounded-lg bg-background overflow-hidden',
        'transition-all duration-200 ease-in-out',
        className
      )}
      style={{ height: `${contentPanelHeight}px` }}
    >
      {/* 顶部拖拽句柄 */}
      <ResizeHandle
        direction="vertical"
        onDrag={handleHeightChange}
        className="absolute top-0 left-0 right-0 h-1 bg-border hover:bg-primary/50 transition-colors cursor-ns-resize z-10"
        containerRef={containerRef}
      />

      {/* 内容区域 */}
      <div className="h-full pt-1">
        {renderBody()}
      </div>

      {/* 底部拖拽句柄 */}
      <ResizeHandle
        direction="vertical"
        onDrag={handleHeightChange}
        className="absolute bottom-0 left-0 right-0 h-1 bg-border hover:bg-primary/50 transition-colors cursor-ns-resize z-10"
        containerRef={containerRef}
        reverse
      />
    </div>
  )
}
