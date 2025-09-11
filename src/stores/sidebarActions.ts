/**
 * Sidebar Actions Store
 * 作为所有"写操作"（向后台发送命令）的唯一出口
 * 基于 sidebar_v2.md 文档的设计
 */

import React from 'react'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { messageBridge, getCurrentTab } from '@/utils/messageBridge'
import type { 
  ExtractionProvider
} from '@/types'

// 动作状态接口 (用于跟踪操作状态)
interface SidebarActionsState {
  // 操作状态跟踪
  pendingOperations: Set<string>
  lastError: string | null
}

// 动作接口
interface SidebarActionsInterface {
  // 页面数据操作
  getPageData: (url: string) => Promise<void>
  triggerExtraction: (url: string, provider: ExtractionProvider, force?: boolean) => Promise<void>
  deletePageData: (url: string) => Promise<void>
  
  // 导航操作
  openOptionsPage: () => Promise<void>
  openConversationsPage: (selectPageUrl?: string) => Promise<void>
  
  // 复制操作 (本地执行)
  copyToClipboard: (text: string) => Promise<boolean>
  
  // 内部工具方法
  setError: (error: string | null) => void
  clearError: () => void
  isOperationPending: (operationId: string) => boolean
}

type SidebarActionsStore = SidebarActionsState & SidebarActionsInterface

// 获取真实的页面URL (从当前活动标签页)
const getRealPageUrl = async (): Promise<string> => {
  try {
    const tab = await getCurrentTab()
    return tab?.url || window.location.href
  } catch (error) {
    console.warn('Failed to get current tab URL, using window location:', error)
    return window.location.href
  }
}

export const useSidebarActions = create<SidebarActionsStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      pendingOperations: new Set<string>(),
      lastError: null,

      // 页面数据操作
      getPageData: async (url: string) => {
        const actualUrl = url || await getRealPageUrl()
        const operationId = `getPageData_${actualUrl}`
        
        try {
          // 标记操作开始
          set(state => ({
            pendingOperations: new Set(state.pendingOperations).add(operationId),
            lastError: null
          }))

          const result = await messageBridge.getPageData(actualUrl)
          console.log('Page data request sent successfully for:', actualUrl, result)
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to get page data'
          set(state => ({ 
            lastError: errorMessage
          }))
          console.error('Failed to get page data:', error)
        } finally {
          // 移除操作标记
          set(state => {
            const newPending = new Set(state.pendingOperations)
            newPending.delete(operationId)
            return { pendingOperations: newPending }
          })
        }
      },

      triggerExtraction: async (url: string, provider: ExtractionProvider, force?: boolean) => {
        const actualUrl = url || await getRealPageUrl()
        const operationId = `triggerExtraction_${actualUrl}_${provider}`
        
        try {
          set(state => ({
            pendingOperations: new Set(state.pendingOperations).add(operationId),
            lastError: null
          }))

          const result = await messageBridge.triggerExtraction(actualUrl, provider, force)
          console.log('Extraction triggered successfully:', { url: actualUrl, provider, force, result })
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to trigger extraction'
          set(state => ({ 
            lastError: errorMessage
          }))
          console.error('Failed to trigger extraction:', error)
        } finally {
          set(state => {
            const newPending = new Set(state.pendingOperations)
            newPending.delete(operationId)
            return { pendingOperations: newPending }
          })
        }
      },

      deletePageData: async (url: string) => {
        const actualUrl = url || await getRealPageUrl()
        const operationId = `deletePageData_${actualUrl}`
        
        try {
          set(state => ({
            pendingOperations: new Set(state.pendingOperations).add(operationId),
            lastError: null
          }))

          const result = await messageBridge.deletePageData(actualUrl)
          console.log('Page data deleted successfully for:', actualUrl, result)
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete page data'
          set(state => ({ 
            lastError: errorMessage
          }))
          console.error('Failed to delete page data:', error)
        } finally {
          set(state => {
            const newPending = new Set(state.pendingOperations)
            newPending.delete(operationId)
            return { pendingOperations: newPending }
          })
        }
      },

      // 导航操作
      openOptionsPage: async () => {
        const operationId = 'openOptionsPage'
        
        try {
          set(state => ({
            pendingOperations: new Set(state.pendingOperations).add(operationId),
            lastError: null
          }))

          const result = await messageBridge.openOptionsPage()
          console.log('Options page opened successfully', result)
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to open options page'
          set(state => ({ 
            lastError: errorMessage
          }))
          console.error('Failed to open options page:', error)
        } finally {
          set(state => {
            const newPending = new Set(state.pendingOperations)
            newPending.delete(operationId)
            return { pendingOperations: newPending }
          })
        }
      },

      openConversationsPage: async (selectPageUrl?: string) => {
        const operationId = 'openConversationsPage'
        
        try {
          set(state => ({
            pendingOperations: new Set(state.pendingOperations).add(operationId),
            lastError: null
          }))

          const result = await messageBridge.openConversationsPage(selectPageUrl)
          console.log('Conversations page opened successfully', result)
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to open conversations page'
          set(state => ({ 
            lastError: errorMessage
          }))
          console.error('Failed to open conversations page:', error)
        } finally {
          set(state => {
            const newPending = new Set(state.pendingOperations)
            newPending.delete(operationId)
            return { pendingOperations: newPending }
          })
        }
      },

      // 复制操作 (本地执行)
      copyToClipboard: async (text: string): Promise<boolean> => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text)
            console.log('Text copied to clipboard successfully')
            return true
          } else {
            // 兼容性回退
            const textArea = document.createElement('textarea')
            textArea.value = text
            textArea.style.position = 'fixed'
            textArea.style.opacity = '0'
            document.body.appendChild(textArea)
            textArea.select()
            const success = document.execCommand('copy')
            document.body.removeChild(textArea)
            
            if (success) {
              console.log('Text copied to clipboard successfully (fallback)')
              return true
            } else {
              throw new Error('Copy command failed')
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to copy to clipboard'
          set(state => ({ 
            lastError: errorMessage
          }))
          console.error('Failed to copy to clipboard:', error)
          return false
        }
      },

      // 内部工具方法
      setError: (error: string | null) => {
        set(state => ({ lastError: error }))
      },

      clearError: () => {
        set(state => ({ lastError: null }))
      },

      isOperationPending: (operationId: string) => {
        return get().pendingOperations.has(operationId)
      }
    }),
    {
      name: 'SidebarActionsStore'
    }
  )
)

// 导出便捷的 hooks
export const usePendingOperations = () => useSidebarActions(state => state.pendingOperations)
export const useLastError = () => useSidebarActions(state => state.lastError)

// 导出特定操作的 hooks - 避免对象字面量导致的引用不稳定
export const usePageDataActions = () => {
  const getPageData = useSidebarActions(state => state.getPageData)
  const triggerExtraction = useSidebarActions(state => state.triggerExtraction)
  const deletePageData = useSidebarActions(state => state.deletePageData)
  
  // 使用 useMemo 缓存返回对象避免引用变化
  return React.useMemo(() => ({
    getPageData, triggerExtraction, deletePageData
  }), [getPageData, triggerExtraction, deletePageData])
}

export const useNavigationActions = () => {
  const openOptionsPage = useSidebarActions(state => state.openOptionsPage)
  const openConversationsPage = useSidebarActions(state => state.openConversationsPage)
  
  return React.useMemo(() => ({
    openOptionsPage, openConversationsPage
  }), [openOptionsPage, openConversationsPage])
}

export const useClipboardActions = () => {
  const copyToClipboard = useSidebarActions(state => state.copyToClipboard)
  
  return React.useMemo(() => ({
    copyToClipboard
  }), [copyToClipboard])
}

// 导出错误管理 hooks
export const useErrorActions = () => {
  const setError = useSidebarActions(state => state.setError)
  const clearError = useSidebarActions(state => state.clearError)
  const lastError = useSidebarActions(state => state.lastError)
  
  return React.useMemo(() => ({
    setError, clearError, lastError
  }), [setError, clearError, lastError])
}
