/**
 * 侧边栏主应用组件
 * 使用新的内容提取功能
 */

import React from 'react'
import { SidebarApp as ExtractorSidebarApp } from '@/components/sidebar'

const SidebarApp: React.FC = () => {
  return (
    <div className="h-full w-full">
      <ExtractorSidebarApp className="h-full" />
    </div>
  )
}

export default SidebarApp
