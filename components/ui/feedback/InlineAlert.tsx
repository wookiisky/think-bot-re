import type { ReactNode } from "react"

import { cn } from "../support/cn"

export type InlineAlertTone = "info" | "success" | "warning" | "danger"

interface InlineAlertProps {
  title?: string
  description: ReactNode
  tone?: InlineAlertTone
  action?: ReactNode
  className?: string
}

const tonePalette: Record<InlineAlertTone, { background: string; border: string; title: string; description: string }> = {
  info: {
    background: "rgba(36,98,181,0.12)",
    border: "rgba(36,98,181,0.4)",
    title: "var(--ui-info)",
    description: "var(--ui-text)"
  },
  success: {
    background: "rgba(26,127,55,0.12)",
    border: "rgba(26,127,55,0.4)",
    title: "var(--ui-success)",
    description: "var(--ui-text)"
  },
  warning: {
    background: "rgba(178,94,13,0.12)",
    border: "rgba(178,94,13,0.4)",
    title: "var(--ui-warning)",
    description: "var(--ui-text)"
  },
  danger: {
    background: "rgba(180,35,24,0.12)",
    border: "rgba(180,35,24,0.4)",
    title: "var(--ui-danger)",
    description: "var(--ui-text)"
  }
}

export const InlineAlert = ({ title, description, tone = "info", action, className }: InlineAlertProps) => {
  const palette = tonePalette[tone]

  return (
    <div
      className={cn("flex items-start justify-between gap-4 border px-4 py-3", className)}
      style={{
        backgroundColor: palette.background,
        borderColor: palette.border
      }}
    >
      <div className="space-y-1">
        {title ? (
          <div className="text-sm font-semibold uppercase tracking-[0.08em]" style={{ color: palette.title }}>
            {title}
          </div>
        ) : null}
        <div className="text-sm" style={{ color: palette.description }}>
          {description}
        </div>
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  )
}
