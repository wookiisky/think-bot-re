import { useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react"

import { DragHandle } from "../support/DragHandle"
import { cn } from "../support/cn"
import { createUiLogger } from "../support/logger"

interface SplitPaneProps {
  primary: ReactNode
  secondary: ReactNode
  orientation?: "horizontal" | "vertical"
  initialPrimarySize?: number
  minPrimarySize?: number
  minSecondarySize?: number
  onResize?: (nextSize: number) => void
  className?: string
}

const logger = createUiLogger("[split-pane]")

export const SplitPane = ({
  primary,
  secondary,
  orientation = "vertical",
  initialPrimarySize,
  minPrimarySize = 200,
  minSecondarySize = 200,
  onResize,
  className
}: SplitPaneProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [primarySize, setPrimarySize] = useState<number | undefined>(initialPrimarySize)

  const isVertical = orientation === "vertical"

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    const root = containerRef.current
    if (!root) {
      return
    }

    const rect = root.getBoundingClientRect()
    const startPosition = isVertical ? event.clientX : event.clientY
    const sizeLimit = isVertical ? rect.width : rect.height
    const startSize = primarySize ?? sizeLimit / 2

    logger.info("resize:start", { orientation, startSize })

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      const currentPosition = isVertical ? pointerEvent.clientX : pointerEvent.clientY
      const delta = currentPosition - startPosition
      const raw = startSize + delta
      const clamped = Math.min(sizeLimit - minSecondarySize, Math.max(minPrimarySize, raw))
      setPrimarySize(clamped)
      onResize?.(clamped)
    }

    const handlePointerUp = () => {
      logger.info("resize:end")
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  const primaryStyle = isVertical
    ? {
        flexBasis: primarySize ? `${primarySize}px` : "50%",
        minWidth: `${minPrimarySize}px`
      }
    : {
        flexBasis: primarySize ? `${primarySize}px` : "50%",
        minHeight: `${minPrimarySize}px`
      }

  const secondaryStyle = isVertical
    ? {
        minWidth: `${minSecondarySize}px`
      }
    : {
        minHeight: `${minSecondarySize}px`
      }

  return (
    <div
      ref={containerRef}
      className={cn(isVertical ? "flex" : "flex flex-col", "border", className)}
      style={{
        borderColor: "var(--ui-border)",
        backgroundColor: "var(--ui-surface)"
      }}
    >
      <div className="flex-1" style={primaryStyle}>
        {primary}
      </div>
      <DragHandle orientation={isVertical ? "vertical" : "horizontal"} onPointerDown={handlePointerDown} />
      <div className="flex-1" style={secondaryStyle}>
        {secondary}
      </div>
    </div>
  )
}
