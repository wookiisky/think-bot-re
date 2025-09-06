/**
 * Drag Handle Component
 * Six dots drag handle for reordering items
 */

import React from 'react'
import { cn } from '@/utils/cn'
import { useDragHandle } from './DragDropList'

export interface DragHandleProps {
  className?: string
}

const DragHandle = React.forwardRef<HTMLDivElement, DragHandleProps>(
  ({ className, ...props }, ref) => {
    const listeners = useDragHandle()
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center w-6 h-6 cursor-grab active:cursor-grabbing touch-none',
          'hover:bg-gray-100 rounded transition-colors duration-200',
          className
        )}
        {...listeners}
        {...props}
      >
        <div className="grid grid-cols-2 gap-0.5">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="w-1 h-1 bg-gray-400 rounded-full"
            />
          ))}
        </div>
      </div>
    )
  }
)

DragHandle.displayName = 'DragHandle'

export { DragHandle }
