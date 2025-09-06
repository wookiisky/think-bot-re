/**
 * Switch Component
 * A toggle switch component built on Headless UI
 */

import React from 'react'
import { Switch as HeadlessSwitch } from '@headlessui/react'
import { cn } from '@/utils/cn'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  size?: 'sm' | 'default' | 'lg'
  label?: string
  description?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ 
    checked, 
    onChange, 
    disabled = false, 
    className, 
    size = 'default',
    label,
    description,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'h-5 w-9',
      default: 'h-6 w-11',
      lg: 'h-7 w-12'
    }

    const knobSizeClasses = {
      sm: 'h-3 w-3',
      default: 'h-4 w-4', 
      lg: 'h-5 w-5'
    }

    const translateClasses = {
      sm: checked ? 'translate-x-5' : 'translate-x-1',
      default: checked ? 'translate-x-6' : 'translate-x-1',
      lg: checked ? 'translate-x-6' : 'translate-x-1'
    }

    const switchElement = (
      <HeadlessSwitch
        ref={ref}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          // Base styles
          'relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Size
          sizeClasses[size],
          // State colors
          checked 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-gray-200 hover:bg-gray-300',
          className
        )}
        {...props}
      >
        <span
          className={cn(
            'inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
            knobSizeClasses[size],
            translateClasses[size]
          )}
        />
      </HeadlessSwitch>
    )

    if (label) {
      return (
        <HeadlessSwitch.Group>
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <HeadlessSwitch.Label className="text-sm font-medium text-gray-900">
                {label}
              </HeadlessSwitch.Label>
              {description && (
                <p className="text-sm text-gray-500">{description}</p>
              )}
            </div>
            {switchElement}
          </div>
        </HeadlessSwitch.Group>
      )
    }

    return switchElement
  }
)

Switch.displayName = 'Switch'

export { Switch }
