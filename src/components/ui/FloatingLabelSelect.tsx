/**
 * Floating Label Select Component
 * Select dropdown with floating label animation
 */

import React, { useState, Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const floatingSelectVariants = cva(
  'block w-full px-2 py-1.5 text-sm bg-white border border-gray-300 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent peer placeholder-transparent transition-all duration-200 cursor-default',
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

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface FloatingLabelSelectProps
  extends VariantProps<typeof floatingSelectVariants> {
  options: SelectOption[]
  value?: string | number
  onChange: (value: string | number) => void
  label: string
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
  description?: string
}

const FloatingLabelSelect = React.forwardRef<HTMLDivElement, FloatingLabelSelectProps>(
  ({ 
    options, 
    value, 
    onChange, 
    label,
    placeholder, 
    disabled = false,
    className,
    variant,
    error,
    description,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const selectedOption = options.find(option => option.value === value)
    const hasValue = Boolean(selectedOption)
    const isFloating = isFocused || hasValue
    const computedVariant = error ? 'error' : variant

    return (
      <div className="relative" ref={ref} {...props}>
        <Listbox 
          value={value} 
          onChange={onChange} 
          disabled={disabled}
        >
          <div className="relative">
            <Listbox.Button
              className={cn(
                floatingSelectVariants({ variant: computedVariant }),
                'pr-8 text-left',
                className
              )}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            >
              <span className="block truncate">
                {selectedOption ? selectedOption.label : (placeholder || ' ')}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-3.5 w-3.5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <label
              className={cn(
                floatingLabelVariants({ floating: isFloating }),
                error && 'text-red-500',
                isFloating && !error && 'text-blue-600'
              )}
            >
              {label}
            </label>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-0.5 max-h-60 w-full overflow-auto rounded-md bg-white py-0.5 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={({ active, disabled }) =>
                      cn(
                        'relative cursor-default select-none py-1.5 pl-8 pr-3',
                        active && !disabled && 'bg-blue-100 text-blue-900',
                        disabled && 'cursor-not-allowed opacity-50'
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={cn(
                            'block truncate',
                            selected ? 'font-medium' : 'font-normal'
                          )}
                        >
                          {option.label}
                        </span>
                        {selected && (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-blue-600">
                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>

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

FloatingLabelSelect.displayName = 'FloatingLabelSelect'

export { FloatingLabelSelect, floatingSelectVariants }
