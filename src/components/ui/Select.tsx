/**
 * Select Component
 * A dropdown select component built on Headless UI
 */

import React, { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { cn } from '@/utils/cn'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value?: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  description?: string
  error?: string
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ 
    options, 
    value, 
    onChange, 
    placeholder = 'Select an option', 
    disabled = false,
    className,
    label,
    description,
    error,
    ...props 
  }, ref) => {
    const selectedOption = options.find(option => option.value === value)

    return (
      <div className="space-y-2" ref={ref} {...props}>
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
        
        <Listbox value={value} onChange={onChange} disabled={disabled}>
          <div className="relative">
            <Listbox.Button
              className={cn(
                'relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left shadow-sm',
                'border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
                'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                className
              )}
            >
              <span className="block truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={({ active, disabled }) =>
                      cn(
                        'relative cursor-default select-none py-2 pl-10 pr-4',
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
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
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
          <p className="text-sm text-gray-500">{description}</p>
        )}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
