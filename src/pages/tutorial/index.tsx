/**
 * 教程页面入口
 */

import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TutorialApp from './TutorialApp'
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
const container = document.getElementById('tutorial-root')
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TutorialApp />
      </QueryClientProvider>
    </React.StrictMode>
  )
}
