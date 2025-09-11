/**
 * Resize Handle Component
 * A drag handle for resizing panel heights vertically
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/utils/cn'

export interface ResizeHandleProps {
  direction: 'vertical' | 'horizontal'
  onDrag: (deltaOrNew: number) => void
  className?: string
  containerRef?: React.RefObject<HTMLElement>
  reverse?: boolean
}

const ResizeHandle = React.forwardRef<HTMLDivElement, ResizeHandleProps>(
  ({ direction, onDrag, className, containerRef, reverse = false, ...props }, ref) => {
    const isDragging = useRef(false)
    const startPos = useRef(0)
    const startSize = useRef(0)
    
    const handleMouseDown = useCallback((event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      
      isDragging.current = true
      startPos.current = direction === 'vertical' ? event.clientY : event.clientX
      
      // Get the initial size of the container
      if (containerRef?.current) {
        const rect = containerRef.current.getBoundingClientRect()
        startSize.current = direction === 'vertical' ? rect.height : rect.width
      }
      
      // Add global event listeners
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = direction === 'vertical' ? 'ns-resize' : 'ew-resize'
      document.body.style.userSelect = 'none'
    }, [direction, containerRef])
    
    const handleMouseMove = useCallback((event: MouseEvent) => {
      if (!isDragging.current) return
      
      const currentPos = direction === 'vertical' ? event.clientY : event.clientX
      const delta = currentPos - startPos.current
      
      // Calculate new size based on direction and reverse setting
      const newSize = reverse 
        ? startSize.current - delta
        : startSize.current + delta
      
      onDrag(newSize)
    }, [direction, onDrag, reverse])
    
    const handleMouseUp = useCallback(() => {
      isDragging.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }, [handleMouseMove])
    
    // Cleanup on unmount
    useEffect(() => {
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }, [handleMouseMove, handleMouseUp])
    
    return (
      <div
        ref={ref}
        className={cn(
          'select-none touch-none',
          direction === 'vertical' && 'cursor-ns-resize',
          direction === 'horizontal' && 'cursor-ew-resize',
          className
        )}
        onMouseDown={handleMouseDown}
        {...props}
      />
    )
  }
)

ResizeHandle.displayName = 'ResizeHandle'

export { ResizeHandle }
