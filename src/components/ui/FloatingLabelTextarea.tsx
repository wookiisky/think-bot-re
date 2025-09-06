/**
 * Floating Label Textarea Component
 * Textarea with floating label animation
 */

import React, { useState, useRef, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const floatingTextareaVariants = cva(
  'block w-full px-2 py-1.5 text-sm bg-white border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent peer placeholder-transparent transition-all duration-200 resize-y min-h-[60px]',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:ring-blue-500',
        error: 'border-red-300 focus:ring-red-500',
        success: 'border-green-300 focus:ring-green-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const floatingLabelVariants = cva(
  'absolute left-2 text-sm text-gray-500 duration-200 transform origin-left pointer-events-none transition-all px-1 top-0',
  {
    variants: {
      floating: {
        true: 'scale-75 -translate-y-2.5 text-blue-600 bg-white',
        false: 'scale-100 translate-y-1.5 text-gray-500',
      },
    },
    defaultVariants: {
      floating: false,
    },
  }
)

export interface FloatingLabelTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof floatingTextareaVariants> {
  label: string
  error?: string
  description?: string
}

const FloatingLabelTextarea = React.forwardRef<HTMLTextAreaElement, FloatingLabelTextareaProps>(
  ({ className, variant, label, error, description, value, defaultValue, rows = 4, ...props }, ref) => {
    const [hasValue, setHasValue] = useState(Boolean(value || defaultValue))
    const [isFocused, setIsFocused] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
      setHasValue(Boolean(value))
    }, [value])

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      setHasValue(Boolean(e.target.value))
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(Boolean(e.target.value))
      props.onChange?.(e)
    }

    const isFloating = isFocused || hasValue
    const computedVariant = error ? 'error' : variant

    return (
      <div className="relative">
        <textarea
          ref={ref || textareaRef}
          className={cn(
            floatingTextareaVariants({ variant: computedVariant }),
            className
          )}
          placeholder=" "
          value={value}
          defaultValue={defaultValue}
          rows={rows}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        
        <label
          className={cn(
            floatingLabelVariants({ floating: isFloating }),
            error && 'text-red-500',
            isFloating && !error && 'text-blue-600'
          )}
        >
          {label}
        </label>

        {description && !error && (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        )}
        
        {error && (
          <p className="mt-0.5 text-xs text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

FloatingLabelTextarea.displayName = 'FloatingLabelTextarea'

export { FloatingLabelTextarea, floatingTextareaVariants }
