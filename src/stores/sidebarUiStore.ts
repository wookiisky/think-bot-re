/**
 * Sidebar UI Store
 * 管理所有非持久化的 UI 状态
 * 基于 sidebar_v2.md 文档的设计
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { SidebarUiState } from '@/types'

// UI 状态接口 (继承基础状态并扩展)
interface ExtendedSidebarUiState extends SidebarUiState {
  // 额外的 UI 状态
  isIncludeExtraction: boolean   // "附带页面内容" 开关状态
}

// UI 动作接口
interface SidebarUiActions {
  // 输入框相关
  setInputDraft: (draft: string) => void
  setInputHeight: (height: number) => void
  clearInputDraft: () => void
  
  // 面板高度管理
  setContentPanelHeight: (height: number) => void
  
  // 图片管理
  addImageDraft: (imageUrl: string) => void
  removeImageDraft: (imageUrl: string) => void
  clearImageDrafts: () => void
  
  // 滚动锚点管理
  setScrollAnchor: (key: string, position: number) => void
  getScrollAnchor: (key: string) => number | undefined
  clearScrollAnchors: () => void
  
  // 提取内容开关
  setIncludeExtraction: (include: boolean) => void
  
  // 批量更新状态
  updateUiState: (updates: Partial<ExtendedSidebarUiState>) => void
  
  // 重置状态
  resetUiState: () => void
}

type SidebarUiStore = ExtendedSidebarUiState & SidebarUiActions

// 默认状态
const defaultState: ExtendedSidebarUiState = {
  inputDraft: '',
  inputHeight: 36, // 默认单行高度
  contentPanelHeight: 300, // 默认内容面板高度
  imageDrafts: [],
  scrollAnchors: {},
  isIncludeExtraction: true // 默认开启附带页面内容
}

export const useSidebarUiStore = create<SidebarUiStore>()(
  devtools(
    immer((set, get) => ({
      ...defaultState,

      // 输入框相关
      setInputDraft: (draft: string) => {
        set((state) => {
          state.inputDraft = draft
        })
      },

      setInputHeight: (height: number) => {
        set((state) => {
          state.inputHeight = Math.max(36, Math.min(height, 200)) // 限制高度范围
        })
      },

      clearInputDraft: () => {
        set((state) => {
          state.inputDraft = ''
          state.inputHeight = 36 // 重置为默认高度
        })
      },

      // 面板高度管理
      setContentPanelHeight: (height: number) => {
        set((state) => {
          state.contentPanelHeight = Math.max(100, Math.min(height, 600)) // 限制高度范围
        })
      },

      // 图片管理
      addImageDraft: (imageUrl: string) => {
        set((state) => {
          // 避免重复添加相同图片
          if (!state.imageDrafts.includes(imageUrl)) {
            state.imageDrafts.push(imageUrl)
          }
        })
      },

      removeImageDraft: (imageUrl: string) => {
        set((state) => {
          const index = state.imageDrafts.indexOf(imageUrl)
          if (index > -1) {
            state.imageDrafts.splice(index, 1)
          }
        })
      },

      clearImageDrafts: () => {
        set((state) => {
          state.imageDrafts = []
        })
      },

      // 滚动锚点管理
      setScrollAnchor: (key: string, position: number) => {
        set((state) => {
          state.scrollAnchors[key] = position
        })
      },

      getScrollAnchor: (key: string) => {
        return get().scrollAnchors[key]
      },

      clearScrollAnchors: () => {
        set((state) => {
          state.scrollAnchors = {}
        })
      },

      // 提取内容开关
      setIncludeExtraction: (include: boolean) => {
        set((state) => {
          state.isIncludeExtraction = include
        })
      },

      // 批量更新状态
      updateUiState: (updates: Partial<ExtendedSidebarUiState>) => {
        set((state) => {
          Object.assign(state, updates)
        })
      },

      // 重置状态
      resetUiState: () => {
        set((state) => {
          Object.assign(state, defaultState)
        })
      }
    })),
    {
      name: 'SidebarUiStore'
    }
  )
)

// 导出便捷的选择器
export const useInputDraft = () => useSidebarUiStore(state => state.inputDraft)
export const useInputHeight = () => useSidebarUiStore(state => state.inputHeight)
export const useContentPanelHeight = () => useSidebarUiStore(state => state.contentPanelHeight)
export const useImageDrafts = () => useSidebarUiStore(state => state.imageDrafts)
export const useIsIncludeExtraction = () => useSidebarUiStore(state => state.isIncludeExtraction)

// 导出组合选择器
export const useInputState = () => useSidebarUiStore(state => ({
  draft: state.inputDraft,
  height: state.inputHeight,
  images: state.imageDrafts,
  includeExtraction: state.isIncludeExtraction
}))

export const usePanelHeights = () => useSidebarUiStore(state => ({
  content: state.contentPanelHeight,
  input: state.inputHeight
}))

// 导出滚动相关的 hooks
export const useScrollAnchors = () => useSidebarUiStore(state => ({
  anchors: state.scrollAnchors,
  setAnchor: state.setScrollAnchor,
  getAnchor: state.getScrollAnchor,
  clearAnchors: state.clearScrollAnchors
}))
