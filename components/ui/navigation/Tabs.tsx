import type { ReactNode } from "react"

import { cn } from "../support/cn"

type TabState = "idle" | "loading" | "hasData"

type Orientation = "horizontal" | "vertical"

type TabSize = "sm" | "md"

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
  badge?: ReactNode
  disabled?: boolean
  state?: TabState
  tooltip?: string
}

interface TabsProps {
  items: TabItem[]
  activeId: string
  onSelect: (id: string) => void
  orientation?: Orientation
  size?: TabSize
  stretch?: boolean
  className?: string
}

const sizeClassMap: Record<TabSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-3 text-sm"
}

const indicatorColor = (state: TabState | undefined, isActive: boolean) => {
  if (state === "loading") {
    return "linear-gradient(90deg, #0b63ff 0%, #ff7a1a 100%)"
  }

  if (state === "hasData" && !isActive) {
    return "#0b63ff"
  }

  return isActive ? "#0b63ff" : "transparent"
}

export const Tabs = ({
  items,
  activeId,
  onSelect,
  orientation = "horizontal",
  size = "md",
  stretch = false,
  className
}: TabsProps) => {
  const isVertical = orientation === "vertical"

  return (
    <nav
      className={cn(
        isVertical ? "flex border" : "flex flex-col border",
        className
      )}
      role="tablist"
      style={{ borderColor: "var(--ui-border)", backgroundColor: "var(--ui-surface)" }}
      aria-orientation={orientation}
    >
      <div className={cn(isVertical ? "flex flex-col" : "flex items-stretch")}
      >
        {items.map((item) => {
          const isActive = item.id === activeId
          const indicator = indicatorColor(item.state, isActive)

          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              disabled={item.disabled}
              onClick={() => onSelect(item.id)}
              title={item.tooltip}
              className={cn(
                "relative flex items-center gap-2 border-b text-left uppercase tracking-[0.08em] transition-colors",
                stretch ? "flex-1" : "",
                sizeClassMap[size],
                item.disabled ? "opacity-60" : "hover:bg-[rgba(11,99,255,0.08)]"
              )}
              style={{
                borderColor: "var(--ui-border)",
                color: isActive ? "var(--ui-text)" : "var(--ui-text-muted)",
                backgroundColor: isActive ? "rgba(11,99,255,0.06)" : "var(--ui-surface)"
              }}
            >
              {item.icon ? <span className="text-base">{item.icon}</span> : null}
              <span className="truncate">{item.label}</span>
              {item.badge ? <span className="text-xs" style={{ color: "var(--ui-text-muted)" }}>{item.badge}</span> : null}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute",
                  isVertical ? "left-0 top-0 h-full w-1" : "bottom-0 left-0 h-1 w-full"
                )}
                style={{
                  backgroundImage: indicator.includes("linear-gradient") ? indicator : undefined,
                  backgroundColor: indicator.includes("linear-gradient") ? undefined : indicator
                }}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
