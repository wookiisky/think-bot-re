/**
 * Sidebar Session Store
 * 管理当前页面 PageData 的只读镜像，以及与数据加载相关的状态
 * 基于 sidebar_v2.md 文档的设计
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { messageBridge, getCurrentTab } from '@/utils/messageBridge'
import type { 
  EnhancedPageData, 
  DetailedExtractionStatus, 
  ExtractionProvider,
  OnDataChangedEvt,
  OnExtractionStatusChangedEvt
} from '@/types'

// Session 状态接口
interface SidebarSessionState {
  // 页面数据镜像 (只读)
  pageData: EnhancedPageData | null
  
  // 数据加载状态
  isPageDataLoading: boolean
  pageDataError: string | null
  
  // 提取状态
  extractionStatus: DetailedExtractionStatus
  
  // 当前页面 URL
  currentPageUrl: string | null
}

// Session 动作接口
interface SidebarSessionActions {
  // 设置当前页面并触发数据加载
  setCurrentPage: (url: string) => void
  
  // 手动刷新页面数据
  refreshPageData: () => Promise<void>
  
  // 设置页面数据 (通过事件监听更新)
  setPageData: (pageData: EnhancedPageData | null) => void
  
  // 设置加载状态
  setPageDataLoading: (loading: boolean) => void
  setPageDataError: (error: string | null) => void
  
  // 更新提取状态
  updateExtractionStatus: (status: DetailedExtractionStatus) => void
  
  // 清理状态
  clearState: () => void
  
  // 处理 Background 事件
  handleDataChangedEvent: (event: OnDataChangedEvt) => void
  handleExtractionStatusEvent: (event: OnExtractionStatusChangedEvt) => void
}

type SidebarSessionStore = SidebarSessionState & SidebarSessionActions

// 初始状态
const initialState: SidebarSessionState = {
  pageData: null,
  isPageDataLoading: false,
  pageDataError: null,
  extractionStatus: {
    status: 'loading',
    stage: 'idle'
  },
  currentPageUrl: null
}

export const useSidebarSessionStore = create<SidebarSessionStore>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      // 设置当前页面并触发数据加载
      setCurrentPage: (url: string) => {
        const { currentPageUrl } = get()
        
        // 如果是同一个页面，不重复加载
        if (currentPageUrl === url) {
          return
        }

        set((state) => {
          state.currentPageUrl = url
          state.isPageDataLoading = true
          state.pageDataError = null
          state.pageData = null
          state.extractionStatus = {
            status: 'loading',
            stage: 'idle'
          }
        })

        // 触发页面数据获取 (实际实现中会发送消息到 Background)
        get().refreshPageData()
      },

      // 手动刷新页面数据
      refreshPageData: async () => {
        const { currentPageUrl } = get()
        let targetUrl = currentPageUrl

        // 如果没有设置当前页面URL，尝试从当前标签页获取
        if (!targetUrl) {
          try {
            const tab = await getCurrentTab()
            targetUrl = tab?.url
            if (!targetUrl) {
              console.warn('No current page URL available, cannot refresh data')
              return
            }
          } catch (error) {
            console.warn('Failed to get current tab URL:', error)
            return
          }
        }

        set((state) => {
          state.isPageDataLoading = true
          state.pageDataError = null
        })

        try {
          console.log('Refreshing page data for:', targetUrl)
          
          // 发送获取页面数据的命令到后台
          const result = await messageBridge.getPageData(targetUrl)
          console.log('Page data refresh command sent:', result)
          
          // 数据将通过 onDataChanged 事件异步返回
          
        } catch (error) {
          console.error('Failed to refresh page data:', error)
          set((state) => {
            state.isPageDataLoading = false
            state.pageDataError = error instanceof Error ? error.message : 'Failed to refresh page data'
          })
        }
      },

      // 设置页面数据 (通过事件监听更新)
      setPageData: (pageData: EnhancedPageData | null) => {
        set((state) => {
          state.pageData = pageData
          state.isPageDataLoading = false
          state.pageDataError = null
        })
      },

      // 设置加载状态
      setPageDataLoading: (loading: boolean) => {
        set((state) => {
          state.isPageDataLoading = loading
        })
      },

      setPageDataError: (error: string | null) => {
        set((state) => {
          state.pageDataError = error
          state.isPageDataLoading = false
        })
      },

      // 更新提取状态
      updateExtractionStatus: (status: DetailedExtractionStatus) => {
        set((state) => {
          state.extractionStatus = status
        })
      },

      // 清理状态
      clearState: () => {
        set((state) => {
          Object.assign(state, initialState)
        })
      },

      // 处理 Background 事件
      handleDataChangedEvent: (event: OnDataChangedEvt) => {
        // Check if event exists and has required properties
        if (!event || !event.pageUrl) {
          console.warn('Invalid data changed event:', event)
          return
        }
        
        const { currentPageUrl } = get()
        
        // 只处理当前页面的数据变更事件
        if (event.pageUrl === currentPageUrl) {
          console.log('Data changed for current page, refreshing...')
          get().refreshPageData()
        }
      },

      handleExtractionStatusEvent: (event: OnExtractionStatusChangedEvt) => {
        // Check if event exists and has required properties
        if (!event || !event.pageUrl) {
          console.warn('Invalid extraction status event:', event)
          return
        }
        
        const { currentPageUrl } = get()
        
        // 只处理当前页面的提取状态事件
        if (event.pageUrl === currentPageUrl) {
          set((state) => {
            state.extractionStatus = {
              status: event.status || 'error',
              stage: event.stage || 'error',
              error: event.error
            }
          })
        }
      }
    })),
    {
      name: 'SidebarSessionStore'
    }
  )
)

// 导出便捷的选择器
export const usePageData = () => useSidebarSessionStore(state => state.pageData)
export const useIsPageDataLoading = () => useSidebarSessionStore(state => state.isPageDataLoading)
export const usePageDataError = () => useSidebarSessionStore(state => state.pageDataError)
export const useExtractionStatus = () => useSidebarSessionStore(state => state.extractionStatus)
export const useCurrentPageUrl = () => useSidebarSessionStore(state => state.currentPageUrl)

// 导出组合选择器
export const usePageDataState = () => useSidebarSessionStore(state => ({
  pageData: state.pageData,
  isLoading: state.isPageDataLoading,
  error: state.pageDataError
}))

export const useExtractionState = () => useSidebarSessionStore(state => ({
  status: state.extractionStatus,
  isLoading: state.extractionStatus.status === 'loading'
}))
