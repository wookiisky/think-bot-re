/**
 * SidebarApp Component
 * Sidebar 主应用组件 - 整合所有子组件
 * 基于 sidebar_v2.md 文档设计，专注于内容提取功能
 */

import React, { useEffect, useCallback } from 'react'
import { cn } from '@/utils/cn'
import { ControlBar, ContentArea } from './index'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { 
  useSidebarSessionStore,
  usePageDataActions,
  useInitializeConfig
} from '@/stores'
import { initializeMessageBridge, eventListeners, getCurrentTab } from '@/utils/messageBridge'

interface SidebarAppProps {
  className?: string
}

export const SidebarApp: React.FC<SidebarAppProps> = ({ className }) => {
  // 获取配置初始化 hook - 分别获取避免对象引用变化
  const initializeConfig = useInitializeConfig().initializeConfig
  const isInitialized = useInitializeConfig().isInitialized
  const isLoading = useInitializeConfig().isLoading
  
  // 获取页面数据操作 - 单独获取函数避免对象引用变化
  const getPageData = usePageDataActions().getPageData
  
  // 获取 session store 操作 - 单独获取函数避免对象引用变化
  const setCurrentPage = useSidebarSessionStore(state => state.setCurrentPage)
  const handleDataChangedEvent = useSidebarSessionStore(state => state.handleDataChangedEvent)
  const handleExtractionStatusEvent = useSidebarSessionStore(state => state.handleExtractionStatusEvent)

  // 获取当前页面 URL
  const getCurrentPageUrl = useCallback(async () => {
    try {
      const tab = await getCurrentTab()
      return tab?.url || window.location.href
    } catch (error) {
      console.warn('Failed to get current tab URL, using window location:', error)
      return window.location.href
    }
  }, [])

  // 初始化应用
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Starting sidebar app initialization...')

        // 1. 初始化消息桥接 (带错误容错)
        try {
          await initializeMessageBridge()
          console.log('Message bridge initialized')
        } catch (bridgeError) {
          console.warn('Message bridge initialization failed, but continuing:', bridgeError)
        }

        // 2. 初始化配置
        if (!isInitialized && !isLoading) {
          console.log('Initializing config...')
          try {
            await initializeConfig()
          } catch (configError) {
            console.warn('Config initialization failed:', configError)
          }
        }

        // 3. 获取当前页面 URL
        try {
          const currentUrl = await getCurrentPageUrl()
          console.log('Current page URL:', currentUrl)

          // 4. 设置当前页面并触发数据加载
          setCurrentPage(currentUrl)

          // 5. 获取页面数据 (异步，不阻塞初始化)
          getPageData(currentUrl).catch(error => {
            console.warn('Initial page data loading failed:', error)
          })
        } catch (urlError) {
          console.warn('Failed to get current page URL:', urlError)
        }

        console.log('Sidebar app initialization completed')

      } catch (error) {
        console.error('Failed to initialize sidebar app:', error)
      }
    }

    // 延迟执行避免组件挂载时的竞态条件
    const timer = setTimeout(initializeApp, 10)
    return () => clearTimeout(timer)
  }, [isInitialized, isLoading]) // 只保留状态值，移除函数引用避免无限循环

  // 设置事件监听器
  useEffect(() => {
    console.log('Setting up event listeners...')
    
    // 监听数据变更事件
    const unsubscribeDataChanged = eventListeners.onDataChanged((event) => {
      console.log('Received data changed event:', event)
      try {
        if (event) {
          handleDataChangedEvent(event)
        }
      } catch (error) {
        console.error('Error handling data changed event:', error)
      }
    })

    // 监听提取状态变更事件
    const unsubscribeExtractionStatus = eventListeners.onExtractionStatusChanged((event) => {
      console.log('Received extraction status event:', event)
      try {
        if (event) {
          handleExtractionStatusEvent(event)
        }
      } catch (error) {
        console.error('Error handling extraction status event:', error)
      }
    })

    // 监听设置变更事件
    const unsubscribeSettingsChanged = eventListeners.onSettingsChanged((event) => {
      console.log('Received settings changed event:', event)
      try {
        // 可以在这里处理设置变更，如重新初始化配置
      } catch (error) {
        console.error('Error handling settings changed event:', error)
      }
    })

    // 监听同步状态变更事件
    const unsubscribeSyncStatus = eventListeners.onSyncStatusChanged((event) => {
      console.log('Received sync status event:', event)
      try {
        // 可以在这里显示同步状态的UI提示
      } catch (error) {
        console.error('Error handling sync status event:', error)
      }
    })

    console.log('Event listeners registered')

    // 清理函数
    return () => {
      console.log('Cleaning up event listeners...')
      unsubscribeDataChanged()
      unsubscribeExtractionStatus()
      unsubscribeSettingsChanged()
      unsubscribeSyncStatus()
    }
  }, []) // 空依赖数组，因为事件监听器只需要设置一次

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className={cn(
        'flex items-center justify-center h-full bg-background',
        className
      )}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="animate-spin">
            <span className="material-icons text-2xl">refresh</span>
          </div>
          <div className="text-sm">正在初始化...</div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Sidebar App Error:', error)
        console.error('Error Info:', errorInfo)
      }}
    >
      <div className={cn(
        'flex flex-col h-full bg-background text-foreground',
        'font-sans antialiased',
        className
      )}>
        {/* 顶部控制栏 */}
        <ErrorBoundary
          fallback={
            <div className="p-3 text-center text-sm text-muted-foreground border-b border-border">
              <span className="material-icons text-base mr-2">warning</span>
              控制栏加载失败
            </div>
          }
        >
          <ControlBar />
        </ErrorBoundary>

        {/* 主要内容区域 */}
        <div className="flex-1 p-3 overflow-hidden">
          <ErrorBoundary
            fallback={
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <span className="material-icons text-2xl mb-2 block">error_outline</span>
                  <div className="text-sm">内容区域加载失败</div>
                </div>
              </div>
            }
          >
            <ContentArea />
          </ErrorBoundary>
        </div>

        {/* 状态栏或其他固定元素可以在这里添加 */}
      </div>
    </ErrorBoundary>
  )
}
