/**
 * DragDropList Component
 * A drag and drop sortable list component using @dnd-kit
 */

import React, { createContext, useContext } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
  SortableContext as SortableContextType,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/utils/cn'

// Context for drag handle listeners
const DragHandleContext = createContext<any>(null)

export const useDragHandle = () => {
  const listeners = useContext(DragHandleContext)
  return listeners
}

// Drag handle component that uses the context
function DragHandleComponent() {
  const listeners = useDragHandle()
  
  return (
    <div 
      className="cursor-grab active:cursor-grabbing touch-none"
      {...listeners}
    >
      <svg
        className="h-5 w-5 text-gray-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zM7 8a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zM7 14a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zM13 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 2zM13 8a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zM13 14a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
      </svg>
    </div>
  )
}

export interface DragDropItem {
  id: string
  [key: string]: any
}

interface SortableItemProps {
  id: string
  children: React.ReactNode
  className?: string
}

function SortableItem({ id, children, className }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && 'opacity-50',
        className
      )}
      {...attributes}
    >
      {/* Pass listeners to children via context */}
      <DragHandleContext.Provider value={listeners}>
        {children}
      </DragHandleContext.Provider>
    </div>
  )
}

export interface DragDropListProps<T extends DragDropItem> {
  items: T[]
  onItemsChange: (items: T[]) => void
  renderItem: (item: T, index: number, dragHandle?: React.ReactNode) => React.ReactNode
  keyExtractor?: (item: T) => string
  className?: string
  itemClassName?: string
  disabled?: boolean
}

function DragDropList<T extends DragDropItem>({
  items,
  onItemsChange,
  renderItem,
  keyExtractor = (item) => item.id,
  className,
  itemClassName,
  disabled = false,
}: DragDropListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => keyExtractor(item) === active.id)
      const newIndex = items.findIndex((item) => keyExtractor(item) === over?.id)

      onItemsChange(arrayMove(items, oldIndex, newIndex))
    }
  }

  if (disabled) {
    return (
      <div className={cn('space-y-2', className)}>
        {items.map((item, index) => (
          <div key={keyExtractor(item)} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(keyExtractor)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn('space-y-2', className)}>
          {items.map((item, index) => {
            const key = keyExtractor(item)
            return (
              <SortableItem 
                key={key} 
                id={key} 
                className={itemClassName}
              >
                {renderItem(item, index, <DragHandleComponent />)}
              </SortableItem>
            )
          })}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export { DragDropList }
