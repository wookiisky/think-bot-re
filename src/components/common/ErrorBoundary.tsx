/**
 * React Error Boundary Component
 * 捕获组件树中的 JavaScript 错误，记录错误并显示备用 UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // 调用可选的错误处理回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback UI，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认的错误 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="space-y-2">
              <span className="material-icons text-4xl text-destructive">error</span>
              <h1 className="text-xl font-semibold">应用出现错误</h1>
              <p className="text-sm text-muted-foreground">
                很抱歉，应用遇到了意外错误。请尝试刷新页面或重新打开扩展。
              </p>
            </div>

            {/* 错误详情 (开发环境) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left text-xs bg-muted p-3 rounded-md">
                <summary className="cursor-pointer font-medium mb-2">错误详情</summary>
                <div className="space-y-2">
                  <div>
                    <strong>错误信息:</strong>
                    <pre className="mt-1 p-2 bg-background rounded text-destructive whitespace-pre-wrap">
                      {this.state.error.message}
                    </pre>
                  </div>
                  <div>
                    <strong>堆栈跟踪:</strong>
                    <pre className="mt-1 p-2 bg-background rounded text-muted-foreground whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>组件堆栈:</strong>
                      <pre className="mt-1 p-2 bg-background rounded text-muted-foreground whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* 操作按钮 */}
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <span className="material-icons text-sm mr-2">refresh</span>
                刷新页面
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined })
                }}
                className="w-full"
              >
                重试
              </Button>

              {/* 在扩展环境中提供更多选项 */}
              {typeof chrome !== 'undefined' && chrome.runtime && (
                <Button 
                  variant="ghost"
                  onClick={() => {
                    chrome.tabs.create({
                      url: chrome.runtime.getURL('src/pages/options/index.html')
                    })
                  }}
                  className="w-full"
                >
                  <span className="material-icons text-sm mr-2">settings</span>
                  打开设置页面
                </Button>
              )}
            </div>

            {/* 帮助信息 */}
            <div className="text-xs text-muted-foreground">
              如果问题持续存在，请尝试：
              <ul className="mt-1 text-left list-disc list-inside space-y-1">
                <li>重新启动浏览器</li>
                <li>禁用并重新启用扩展</li>
                <li>检查浏览器控制台是否有更多错误信息</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 便捷的高阶组件版本
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// 轻量级错误边界（用于小组件）
export const LightErrorBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
}> = ({ children, fallback }) => (
  <ErrorBoundary 
    fallback={fallback || (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <span className="material-icons text-base mb-2 block">error_outline</span>
        组件加载失败
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
)
