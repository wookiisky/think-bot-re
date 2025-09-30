import { useCallback, useMemo, useState } from "react"
import type { DragEvent, ReactNode } from "react"

type DragId = string | null

export interface DraggableListRenderProps<TItem> {
  item: TItem
  isDragging: boolean
  id: string
  handleProps: {
    draggable: true
    onDragStart: (event: DragEvent<HTMLButtonElement | HTMLDivElement>) => void
  }
}

export interface DraggableListProps<TItem> {
  items: TItem[]
  getId: (item: TItem) => string
  onReorder: (items: TItem[]) => void
  renderItem: (props: DraggableListRenderProps<TItem>) => ReactNode
  className?: string
}

export const DraggableList = <TItem,>({
  items,
  getId,
  onReorder,
  renderItem,
  className
}: DraggableListProps<TItem>) => {
  const [draggingId, setDraggingId] = useState<DragId>(null)

  const idToIndex = useMemo(() => {
    const map = new Map<string, number>()
    items.forEach((item, index) => {
      map.set(getId(item), index)
    })
    return map
  }, [getId, items])

  const handleDragStart = useCallback((event: DragEvent<HTMLElement>) => {
    const id = event.currentTarget.getAttribute("data-drag-id")
    if (!id) {
      return
    }

    setDraggingId(id)
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", id)
  }, [])

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      if (!draggingId) {
        return
      }

      event.preventDefault()
      const target = (event.target as HTMLElement).closest("[data-drag-id]") as
        | HTMLElement
        | null

      if (!target) {
        return
      }

      const targetId = target.getAttribute("data-drag-id")
      if (!targetId || targetId === draggingId) {
        return
      }

      const fromIndex = idToIndex.get(draggingId)
      const toIndex = idToIndex.get(targetId)

      if (fromIndex == null || toIndex == null || fromIndex === toIndex) {
        return
      }

      const next = [...items]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      onReorder(next)
    },
    [draggingId, idToIndex, items, onReorder]
  )

  const handleDragEnd = useCallback(() => {
    setDraggingId(null)
  }, [])

  return (
    <div className={className} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
      {items.map((item) => {
        const id = getId(item)
        const isDragging = draggingId === id
        return (
          <div
            className="group"
            data-drag-id={id}
            key={id}
            role="listitem"
          >
            {renderItem({
              item,
              isDragging,
              id,
              handleProps: {
                draggable: true,
                onDragStart: handleDragStart
              }
            })}
          </div>
        )
      })}
    </div>
  )
}
