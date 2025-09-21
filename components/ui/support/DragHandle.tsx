import type { PointerEventHandler } from "react"

import { cn } from "./cn"

interface DragHandleProps {
  orientation?: "horizontal" | "vertical"
  onPointerDown?: PointerEventHandler<HTMLDivElement>
  className?: string
  label?: string
}

export const DragHandle = ({
  orientation = "vertical",
  onPointerDown,
  className,
  label
}: DragHandleProps) => {
  const isVertical = orientation === "vertical"
  const sizeClasses = isVertical ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize"

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={label ?? "Resize"}
      onPointerDown={onPointerDown}
      className={cn(
        "flex items-center justify-center bg-[var(--ui-surface-strong)] text-[var(--ui-text-muted)]",
        sizeClasses,
        className
      )}
    >
      <div
        className={cn(
          "bg-[var(--ui-border-strong)]",
          isVertical ? "h-8 w-0.5" : "h-0.5 w-8"
        )}
      />
    </div>
  )
}
