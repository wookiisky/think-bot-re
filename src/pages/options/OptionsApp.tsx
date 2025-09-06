/**
 * 选项页面主应用组件
 */

import React, { useState, useEffect } from 'react'
import {
  OptionsLayout,
  OptionsHeader,
  OptionsContent,
  OptionsSidebar,
  OptionsMain,
  SidebarNavItem
} from '@/components/layout/OptionsLayout'
import { useInitializeConfig, useConfigStore } from '@/stores/configStore'
import BasicSettings from './components/BasicSettings'
import ModelConfig from './components/ModelConfig'
import QuickInputConfig from './components/QuickInputConfig'
import BlacklistSettings from './components/BlacklistSettings'
import ImportExport from './components/ImportExport'
import {
  CogIcon,
  ComputerDesktopIcon,
  CommandLineIcon,
  NoSymbolIcon,
  ArrowPathIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline'

type SettingsSection = 
  | 'basic' 
  | 'models' 
  | 'quickInputs' 
  | 'blacklist' 
  | 'sync' 
  | 'importExport'

const OptionsApp: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('basic')
  const { initializeConfig, isInitialized, isLoading } = useInitializeConfig()

  console.log('OptionsApp render - isInitialized:', isInitialized, 'isLoading:', isLoading)

  useEffect(() => {
    console.log('OptionsApp useEffect - isInitialized:', isInitialized, 'isLoading:', isLoading)
    if (!isInitialized && !isLoading) {
      console.log('Triggering config initialization...')
      initializeConfig()
    }
  }, [isInitialized, isLoading, initializeConfig])

  // Add a backup timeout to force initialization if really stuck (increased to 10 seconds)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentState = useConfigStore.getState()
      console.log('Backup timeout check - isInitialized:', currentState.isInitialized, 'isLoading:', currentState.isLoading)
      
      if (!currentState.isInitialized && !currentState.isLoading) {
        console.warn('Config initialization appears stuck, forcing initialization...')
        initializeConfig()
      }
    }, 10000) // Increased timeout to 10 seconds

    return () => clearTimeout(timeout)
  }, [initializeConfig])

  const navigationItems = [
    {
      id: 'basic' as SettingsSection,
      label: '基础设置',
      icon: <CogIcon />
    },
    {
      id: 'models' as SettingsSection,
      label: '语言模型',
      icon: <ComputerDesktopIcon />
    },
    {
      id: 'quickInputs' as SettingsSection,
      label: '快捷指令',
      icon: <CommandLineIcon />
    },
    {
      id: 'blacklist' as SettingsSection,
      label: '黑名单设置',
      icon: <NoSymbolIcon />
    },
    {
      id: 'sync' as SettingsSection,
      label: '同步设置',
      icon: <ArrowPathIcon />
    },
    {
      id: 'importExport' as SettingsSection,
      label: '导入/导出',
      icon: <DocumentArrowUpIcon />
    }
  ]

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">加载配置中...</span>
        </div>
      )
    }

    switch (activeSection) {
      case 'basic':
        return <BasicSettings />
      case 'models':
        return <ModelConfig />
      case 'quickInputs':
        return <QuickInputConfig />
      case 'blacklist':
        return <BlacklistSettings />
      case 'sync':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">同步设置</h2>
            <p className="text-gray-600">同步设置页面正在开发中...</p>
          </div>
        )
      case 'importExport':
        return <ImportExport />
      default:
        return null
    }
  }

  return (
    <OptionsLayout>
      <OptionsHeader 
        title="Think Bot 设置"
        description="配置您的 AI 助手设置"
      />
      
      <OptionsContent>
        <OptionsSidebar>
          {navigationItems.map((item) => (
            <SidebarNavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activeSection === item.id}
              onClick={() => setActiveSection(item.id)}
            />
          ))}
        </OptionsSidebar>

        <OptionsMain>
          {renderContent()}
        </OptionsMain>
      </OptionsContent>
    </OptionsLayout>
  )
}

export default OptionsApp
