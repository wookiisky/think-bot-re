import { useCallback, useRef, useState } from "react"
import type { ReactNode } from "react"

import { cn } from "../support/cn"

interface ScrollableAreaProps {
  children: ReactNode
  className?: string
  height?: number | string
  stickyHeader?: ReactNode
  stickyFooter?: ReactNode
  onReachTop?: () => void
  onReachBottom?: () => void
}

export const ScrollableArea = ({
  children,
  className,
  height = 320,
  stickyHeader,
  stickyFooter,
  onReachTop,
  onReachBottom
}: ScrollableAreaProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isTop, setIsTop] = useState(true)
  const [isBottom, setIsBottom] = useState(false)

  const handleScroll = useCallback(() => {
    const node = containerRef.current
    if (!node) {
      return
    }

    const atTop = node.scrollTop <= 0
    const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1

    if (atTop && !isTop) {
      onReachTop?.()
    }

    if (atBottom && !isBottom) {
      onReachBottom?.()
    }

    setIsTop(atTop)
    setIsBottom(atBottom)
  }, [isBottom, isTop, onReachBottom, onReachTop])

  const scrollToEdge = (position: "top" | "bottom") => {
    const node = containerRef.current
    if (!node) {
      return
    }

    node.scrollTo({
      top: position === "top" ? 0 : node.scrollHeight,
      behavior: "smooth"
    })
  }

  return (
    <div className={cn("relative border", className)} style={{ borderColor: "var(--ui-border)" }}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto"
        style={{
          maxHeight: typeof height === "number" ? `${height}px` : height,
          backgroundColor: "var(--ui-surface)",
          color: "var(--ui-text)"
        }}
      >
        {stickyHeader ? (
          <div
            className="sticky top-0 border-b px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em]"
            style={{
              backgroundColor: "var(--ui-surface)",
              borderColor: "var(--ui-border)"
            }}
          >
            {stickyHeader}
          </div>
        ) : null}
        <div className="space-y-3 px-4 py-3">{children}</div>
        {stickyFooter ? (
          <div
            className="sticky bottom-0 border-t px-4 py-2 text-xs"
            style={{
              backgroundColor: "var(--ui-surface)",
              borderColor: "var(--ui-border)",
              color: "var(--ui-text-muted)"
            }}
          >
            {stickyFooter}
          </div>
        ) : null}
      </div>
      {!isTop ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-6"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, color-mix(in srgb, var(--ui-text) 14%, transparent), transparent)"
          }}
        />
      ) : null}
      {!isBottom ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-6"
          style={{
            backgroundImage:
              "linear-gradient(to top, color-mix(in srgb, var(--ui-text) 14%, transparent), transparent)"
          }}
        />
      ) : null}
      <div className="pointer-events-none absolute right-2 top-2 flex flex-col gap-2">
        {!isTop ? (
          <button
            type="button"
            onClick={() => scrollToEdge("top")}
            className="pointer-events-auto border px-2 py-1 text-xs uppercase tracking-[0.1em]"
            style={{
              backgroundColor: "var(--ui-surface)",
              borderColor: "var(--ui-border)",
              color: "var(--ui-text)"
            }}
          >
            Top
          </button>
        ) : null}
        {!isBottom ? (
          <button
            type="button"
            onClick={() => scrollToEdge("bottom")}
            className="pointer-events-auto border px-2 py-1 text-xs uppercase tracking-[0.1em]"
            style={{
              backgroundColor: "var(--ui-surface)",
              borderColor: "var(--ui-border)",
              color: "var(--ui-text)"
            }}
          >
            Bottom
          </button>
        ) : null}
      </div>
    </div>
  )
}
