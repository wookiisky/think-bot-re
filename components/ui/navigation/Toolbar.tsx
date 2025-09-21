import type { ReactNode } from "react"

import { cn } from "../support/cn"

interface ToolbarProps {
  title?: ReactNode
  description?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  className?: string
  dense?: boolean
}

export const Toolbar = ({
  title,
  description,
  leading,
  trailing,
  className,
  dense = false
}: ToolbarProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border px-4",
        dense ? "py-2" : "py-3",
        className
      )}
      style={{
        backgroundColor: "var(--ui-surface)",
        borderColor: "var(--ui-border)",
        color: "var(--ui-text)"
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {leading ? <div className="flex items-center gap-2">{leading}</div> : null}
        {(title || description) && (
          <div className="min-w-0">
            {title ? (
              <div
                className="truncate text-sm font-semibold uppercase tracking-[0.08em]"
                style={{ color: "var(--ui-text)" }}
              >
                {title}
              </div>
            ) : null}
            {description ? (
              <div className="text-xs" style={{ color: "var(--ui-text-muted)" }}>
                {description}
              </div>
            ) : null}
          </div>
        )}
      </div>
      {trailing ? <div className="flex items-center gap-2">{trailing}</div> : null}
    </div>
  )
}
