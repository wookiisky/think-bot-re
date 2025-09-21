import type { ReactNode } from "react"

import { cn } from "../support/cn"
import { withAlpha } from "../support/color"
import { useTheme } from "../support/ThemeProvider"

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
  const theme = useTheme()
  const hoverTint = withAlpha(theme.colors.primary, 0.12)
  const activeTint = withAlpha(theme.colors.primary, 0.18)

  return (
    <nav
      className={cn(
        isVertical ? "flex border" : "flex flex-col border",
        className
      )}
      role="tablist"
      style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
      aria-orientation={orientation}
    >
      <div className={cn(isVertical ? "flex flex-col" : "flex items-stretch")}
      >
        {items.map((item) => {
          const isActive = item.id === activeId
          const indicator = (() => {
            if (item.state === "loading") {
              return `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`
            }

            if (item.state === "hasData" && !isActive) {
              return theme.colors.primary
            }

            return isActive ? theme.colors.primary : "transparent"
          })()

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
                item.disabled ? "opacity-60" : cn("hover:bg-[var(--tab-hover)]")
              )}
                style={{
                  borderColor: theme.colors.border,
                  color: isActive ? theme.colors.text : theme.colors.textMuted,
                  backgroundColor: isActive ? activeTint : theme.colors.surface,
                  "--tab-hover": isActive ? activeTint : hoverTint
                }}
            >
              {item.icon ? <span className="text-base">{item.icon}</span> : null}
              <span className="truncate">{item.label}</span>
              {item.badge ? <span className="text-xs" style={{ color: theme.colors.textMuted }}>{item.badge}</span> : null}
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
