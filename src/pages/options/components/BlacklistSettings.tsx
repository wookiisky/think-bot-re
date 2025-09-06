/**
 * Blacklist Settings Component
 * Configuration for website blacklist patterns
 */

import React, { useState } from 'react'
import { useBlacklistConfig, useConfigStore } from '@/stores/configStore'
import { Button, Input } from '@/components/ui'
import { OptionsCard } from '@/components/layout/OptionsLayout'
import { PlusIcon, TrashIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import type { BlacklistPattern } from '@/types/config'

const BlacklistSettings: React.FC = () => {
  const blacklistConfig = useBlacklistConfig()
  const updateBlacklistConfig = useConfigStore(state => state.updateBlacklistConfig)
  
  const [newPattern, setNewPattern] = useState('')
  const [newPatternEnabled, setNewPatternEnabled] = useState(true)

  if (!blacklistConfig) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const handleAddPattern = async () => {
    if (!newPattern.trim()) {
      alert('请输入有效的网站模式')
      return
    }

    const newBlacklistPattern: BlacklistPattern = {
      id: crypto.randomUUID(),
      pattern: newPattern.trim(),
      enabled: newPatternEnabled
    }

    const updatedConfig = {
      ...blacklistConfig,
      patterns: [...blacklistConfig.patterns, newBlacklistPattern]
    }

    await updateBlacklistConfig(updatedConfig)
    setNewPattern('')
    setNewPatternEnabled(true)
  }

  const handleRemovePattern = async (patternId: string) => {
    if (confirm('确定要删除这个黑名单规则吗？')) {
      const updatedConfig = {
        ...blacklistConfig,
        patterns: blacklistConfig.patterns.filter(p => p.id !== patternId)
      }
      await updateBlacklistConfig(updatedConfig)
    }
  }

  const handleTogglePattern = async (patternId: string) => {
    const updatedConfig = {
      ...blacklistConfig,
      patterns: blacklistConfig.patterns.map(p =>
        p.id === patternId ? { ...p, enabled: !p.enabled } : p
      )
    }
    await updateBlacklistConfig(updatedConfig)
  }

  const predefinedPatterns = [
    'example.com',
    '*.google.com',
    'localhost:*',
    '*.github.io',
    'chrome://.*',
    'chrome-extension://.*',
    'about:.*',
    'file://.*'
  ]

  const addPredefinedPattern = (pattern: string) => {
    setNewPattern(pattern)
  }

  return (
    <div>
      <OptionsCard
        title="黑名单设置"
        description="配置不希望 Think Bot 在这些网站上自动激活的规则"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <GlobeAltIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">关于黑名单</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  在黑名单中的网站，Think Bot 将不会自动激活。您仍然可以手动打开侧边栏使用功能。
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Input
              placeholder="输入网站模式，如 example.com 或 *.google.com"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddPattern()}
              className="flex-1"
            />
            <Button onClick={handleAddPattern}>
              <PlusIcon className="h-4 w-4 mr-2" />
              添加
            </Button>
          </div>

          {blacklistConfig.patterns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>还没有配置任何黑名单规则</p>
              <p className="text-sm mt-1">添加规则来控制 Think Bot 的激活范围</p>
            </div>
          ) : (
            <div className="space-y-2">
              {blacklistConfig.patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md"
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleTogglePattern(pattern.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        pattern.enabled
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {pattern.enabled && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <span className={`font-mono text-sm ${
                      pattern.enabled ? 'text-gray-900' : 'text-gray-400 line-through'
                    }`}>
                      {pattern.pattern}
                    </span>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemovePattern(pattern.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </OptionsCard>

      <OptionsCard
        title="常用模式"
        description="点击下方模式快速添加到黑名单"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {predefinedPatterns.map((pattern, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => addPredefinedPattern(pattern)}
              className="text-xs font-mono"
            >
              {pattern}
            </Button>
          ))}
        </div>
      </OptionsCard>

      <OptionsCard
        title="模式语法说明"
        description="了解如何编写黑名单匹配模式"
      >
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">基本模式</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="bg-gray-100 px-1 rounded">example.com</code> - 精确匹配域名</li>
              <li><code className="bg-gray-100 px-1 rounded">*.example.com</code> - 匹配所有子域名</li>
              <li><code className="bg-gray-100 px-1 rounded">example.com/path/*</code> - 匹配特定路径下的所有页面</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">特殊协议</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="bg-gray-100 px-1 rounded">chrome://.*</code> - 所有 Chrome 内部页面</li>
              <li><code className="bg-gray-100 px-1 rounded">chrome-extension://.*</code> - 所有扩展页面</li>
              <li><code className="bg-gray-100 px-1 rounded">file://.*</code> - 所有本地文件</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">通配符</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code className="bg-gray-100 px-1 rounded">*</code> - 匹配任意字符</li>
              <li><code className="bg-gray-100 px-1 rounded">?</code> - 匹配单个字符</li>
              <li>支持正则表达式语法</li>
            </ul>
          </div>
        </div>
      </OptionsCard>
    </div>
  )
}

export default BlacklistSettings
