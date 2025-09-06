/**
 * Floating Label Input Component
 * Input with floating label animation
 */

import React, { useState, useRef, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const floatingInputVariants = cva(
  'block w-full px-2 py-1.5 text-sm bg-white border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent peer placeholder-transparent transition-all duration-200',
  {
    variants: {
      size: {
        default: 'py-1.5',
        sm: 'py-1 text-xs',
        lg: 'py-2 text-base',
      },
      variant: {
        default: 'border-gray-300 focus:ring-blue-500',
        error: 'border-red-300 focus:ring-red-500',
        success: 'border-green-300 focus:ring-green-500',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

const floatingLabelVariants = cva(
  'absolute left-2 text-gray-500 duration-200 transform origin-left pointer-events-none transition-all px-1 top-0',
  {
    variants: {
      size: {
        default: 'text-sm peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1.5 peer-focus:scale-75 peer-focus:-translate-y-2.5',
        sm: 'text-xs peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-2.5',
        lg: 'text-base peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-2 peer-focus:scale-75 peer-focus:-translate-y-2.5',
      },
      floating: {
        true: 'scale-75 -translate-y-2.5 text-blue-600 bg-white',
        false: 'scale-100 translate-y-1.5 text-gray-500',
      },
    },
    defaultVariants: {
      size: 'default',
      floating: false,
    },
  }
)

export interface FloatingLabelInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof floatingInputVariants> {
  label: string
  error?: string
  description?: string
  endIcon?: React.ReactNode
}

const FloatingLabelInput = React.forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ className, type = 'text', size, variant, label, error, description, endIcon, value, defaultValue, ...props }, ref) => {
    const [hasValue, setHasValue] = useState(Boolean(value || defaultValue))
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      setHasValue(Boolean(value))
    }, [value])

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(Boolean(e.target.value))
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(Boolean(e.target.value))
      props.onChange?.(e)
    }

    const isFloating = isFocused || hasValue
    const computedVariant = error ? 'error' : variant

    return (
      <div className="relative">
        <input
          ref={ref || inputRef}
          type={type}
          className={cn(
            floatingInputVariants({ size, variant: computedVariant }),
            endIcon && 'pr-8',
            className
          )}
          placeholder=" "
          value={value}
          defaultValue={defaultValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        
        <label
          className={cn(
            floatingLabelVariants({ 
              size, 
              floating: isFloating 
            }),
            error && 'text-red-500',
            isFloating && !error && 'text-blue-600'
          )}
        >
          {label}
        </label>

        {endIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
            {endIcon}
          </div>
        )}

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

FloatingLabelInput.displayName = 'FloatingLabelInput'

export { FloatingLabelInput, floatingInputVariants, floatingLabelVariants }
