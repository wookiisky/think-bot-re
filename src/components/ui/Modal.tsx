/**
 * Modal Component
 * A modal dialog component built on Headless UI
 */

import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils/cn'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  className?: string
  panelClassName?: string
  preventClose?: boolean
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    isOpen, 
    onClose, 
    title, 
    description, 
    children, 
    size = 'md',
    showCloseButton = true,
    className,
    panelClassName,
    preventClose = false,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-2xl',
      full: 'max-w-full mx-4'
    }

    const handleClose = () => {
      if (!preventClose) {
        onClose()
      }
    }

    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog 
          as="div" 
          className={cn("relative z-50", className)} 
          onClose={handleClose}
          ref={ref}
          {...props}
        >
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          {/* Modal container */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel 
                  className={cn(
                    'w-full transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all',
                    sizeClasses[size],
                    panelClassName
                  )}
                >
                  {/* Header */}
                  {(title || showCloseButton) && (
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        {title && (
                          <Dialog.Title
                            as="h3"
                            className="text-lg font-medium leading-6 text-gray-900"
                          >
                            {title}
                          </Dialog.Title>
                        )}
                        {description && (
                          <Dialog.Description className="mt-1 text-sm text-gray-500">
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                      
                      {showCloseButton && !preventClose && (
                        <button
                          type="button"
                          className="ml-4 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onClick={onClose}
                        >
                          <span className="sr-only">Close</span>
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="mt-2">
                    {children}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    )
  }
)

Modal.displayName = 'Modal'

export { Modal }
