/**
 * UI相关类型定义
 */

// 基础UI组件props
export interface BaseUIProps {
  className?: string
  children?: React.ReactNode
  disabled?: boolean
}

// 按钮变体
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

// 输入框类型
export type InputType = 'text' | 'email' | 'password' | 'url' | 'number'

// 主题类型
export type Theme = 'light' | 'dark' | 'system'

// 语言类型
export type Language = 'zh_CN' | 'en'

// 模态框类型
export interface ModalProps extends BaseUIProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

// 确认对话框
export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

// 加载状态
export interface LoadingState {
  isLoading: boolean
  message?: string
  progress?: number
}

// 错误状态
export interface ErrorState {
  hasError: boolean
  error?: Error | string
  retry?: () => void
}

// 表单验证
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// 拖拽排序项目
export interface DragDropItem {
  id: string
  index: number
  isDragging?: boolean
}

// 分页信息
export interface PaginationInfo {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
}

// 搜索过滤器
export interface SearchFilter {
  query: string
  category?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

// 侧边栏状态
export interface SidebarState {
  isOpen: boolean
  width: number
  activeTab: string
  contentHeight: number
}

// 选项页面状态
export interface OptionsState {
  activeSection: string
  hasUnsavedChanges: boolean
  isSaving: boolean
  lastSaved?: number
}
