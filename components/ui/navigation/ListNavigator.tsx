import { useMemo, useState } from "react"
import type { ReactNode } from "react"

import { Badge } from "../display/Badge"
import { Icon } from "../display/Icon"
import { SearchInput } from "../input/SearchInput"
import { StatusBadge } from "../feedback/StatusBadge"
import { cn } from "../support/cn"
import { withAlpha } from "../support/color"
import { useTheme } from "../support/ThemeProvider"

export interface ListNavigatorItem {
  id: string
  title: string
  description?: string
  meta?: string
  icon?: string
  statusTone?: Parameters<typeof StatusBadge>[0]["tone"]
  statusLabel?: string
  badgeLabel?: string
}

interface ListNavigatorProps {
  items: ListNavigatorItem[]
  activeId?: string
  onSelect: (id: string) => void
  searchable?: boolean
  searchPlaceholder?: string
  emptyState?: ReactNode
  footer?: ReactNode
  className?: string
}

export const ListNavigator = ({
  items,
  activeId,
  onSelect,
  searchable = true,
  searchPlaceholder = "Search",
  emptyState,
  footer,
  className
}: ListNavigatorProps) => {
  const [query, setQuery] = useState("")
  const theme = useTheme()

  const filtered = useMemo(() => {
    if (!query) {
      return items
    }
    const lower = query.toLowerCase()
    return items.filter((item) =>
      item.title.toLowerCase().includes(lower) ||
      (item.description?.toLowerCase().includes(lower) ?? false) ||
      (item.meta?.toLowerCase().includes(lower) ?? false)
    )
  }, [items, query])

  const highlight = withAlpha(theme.colors.primary, 0.16)
  const hoverTint = withAlpha(theme.colors.primary, 0.1)

  return (
    <div
      className={cn("flex h-full flex-col border", className)}
      style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}
    >
      {searchable ? (
        <div className="border-b p-3" style={{ borderColor: theme.colors.border }}>
          <SearchInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
            helperText={`${filtered.length} results`}
            placeholder={searchPlaceholder}
          />
        </div>
      ) : null}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm" style={{ color: theme.colors.textMuted }}>
            {emptyState ?? "No items"}
          </div>
        ) : (
          <ul>
            {filtered.map((item) => {
              const isActive = item.id === activeId
              const itemStyle = {
                borderColor: theme.colors.border,
                color: isActive ? theme.colors.primary : theme.colors.text,
                backgroundColor: isActive ? highlight : "transparent",
                "--navigator-hover": isActive ? highlight : hoverTint
              }
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 border-b px-4 py-3 text-left",
                      "hover:bg-[var(--navigator-hover)]"
                    )}
                    style={itemStyle}
                  >
                    <div className="flex items-start gap-3">
                      {item.icon ? (
                        <Icon name={item.icon} size="md" ariaHidden />
                      ) : null}
                      <div>
                        <div
                          className="text-sm font-semibold uppercase tracking-[0.08em]"
                          style={{ color: isActive ? theme.colors.primary : theme.colors.text }}
                        >
                          {item.title}
                        </div>
                        {item.description ? (
                          <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                            {item.description}
                          </div>
                        ) : null}
                        {item.meta ? (
                          <div className="mt-1 text-xs" style={{ color: theme.colors.textMuted }}>
                            {item.meta}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {item.badgeLabel ? (
                        <Badge size="sm">{item.badgeLabel}</Badge>
                      ) : null}
                      {item.statusLabel ? (
                        <StatusBadge label={item.statusLabel} tone={item.statusTone ?? "neutral"} />
                      ) : null}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {footer ? (
        <div className="border-t p-3" style={{ borderColor: theme.colors.border }}>
          {footer}
        </div>
      ) : null}
    </div>
  )
}
