/**
 * 侧边栏主应用组件
 */

import React from 'react'

const SidebarApp: React.FC = () => {
  return (
    <div className="h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="p-4">
        <h1 className="text-lg font-semibold mb-4">Think Bot</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>侧边栏正在开发中...</p>
          <p className="mt-2">阶段一：项目初始化与核心架构已完成</p>
        </div>
      </div>
    </div>
  )
}

export default SidebarApp
