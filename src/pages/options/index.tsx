/**
 * 选项页面入口
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OptionsApp from './OptionsApp'
import '../../styles/globals.css'

// 创建 QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// 渲染应用
const container = document.getElementById('options-root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <OptionsApp />
      </QueryClientProvider>
    </React.StrictMode>
  )
}
