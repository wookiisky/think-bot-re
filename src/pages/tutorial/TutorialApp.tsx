/**
 * 教程页面主应用组件
 */

import React from 'react'

const TutorialApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            欢迎使用 Think Bot
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            与网页内容进行智能对话的浏览器扩展
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="text-gray-600 dark:text-gray-400 space-y-4">
              <p>🎉 感谢安装 Think Bot！</p>
              <p>教程页面正在开发中...</p>
              <p>阶段一：项目初始化与核心架构已完成</p>
              
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm">
                  请点击浏览器工具栏中的 Think Bot 图标开始使用
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TutorialApp
