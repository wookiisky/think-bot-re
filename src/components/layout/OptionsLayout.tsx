/**
 * Options Layout Component
 * Two-column layout for options page
 */

import React from 'react'
import { cn } from '@/utils/cn'

interface OptionsLayoutProps {
  children: React.ReactNode
  className?: string
}

export function OptionsLayout({ children, className }: OptionsLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-white', className)}>
      {children}
    </div>
  )
}

interface OptionsHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function OptionsHeader({ title, description, children, className }: OptionsHeaderProps) {
  return (
    <header className={cn('bg-white border-b border-gray-200', className)}>
      <div className="w-full px-2 sm:px-3 lg:px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-xs text-gray-600 mt-0.5">{description}</p>
            )}
          </div>
          {children && (
            <div className="flex items-center space-x-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

interface OptionsContentProps {
  children: React.ReactNode
  className?: string
}

export function OptionsContent({ children, className }: OptionsContentProps) {
  return (
    <div className={cn('w-full px-2 sm:px-3 lg:px-4 py-3', className)}>
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-0">
        {children}
      </div>
    </div>
  )
}

interface OptionsSidebarProps {
  children: React.ReactNode
  className?: string
}

export function OptionsSidebar({ children, className }: OptionsSidebarProps) {
  return (
    <aside className={cn('lg:col-span-3 pr-3 border-r border-gray-200', className)}>
      <nav className="space-y-1">
        {children}
      </nav>
    </aside>
  )
}

interface OptionsMainProps {
  children: React.ReactNode
  className?: string
}

export function OptionsMain({ children, className }: OptionsMainProps) {
  return (
    <main className={cn('lg:col-span-9 pl-3', className)}>
      {children}
    </main>
  )
}

interface SidebarNavItemProps {
  label: string
  isActive?: boolean
  onClick: () => void
  icon?: React.ReactNode
  className?: string
}

export function SidebarNavItem({ 
  label, 
  isActive, 
  onClick, 
  icon,
  className 
}: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200',
        isActive
          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
        className
      )}
    >
      {icon && (
        <span className={cn(
          'mr-2 h-4 w-4 transition-colors',
          isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-600'
        )}>
          {icon}
        </span>
      )}
      {label}
    </button>
  )
}

interface OptionsCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function OptionsCard({ title, description, children, className }: OptionsCardProps) {
  return (
    <div className={cn('border-b border-gray-200 last:border-b-0', className)}>
      <div className="px-3 py-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
        </div>
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}
