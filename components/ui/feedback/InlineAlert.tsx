import { useMemo } from "react"
import type { ReactNode } from "react"

import { cn } from "../support/cn"
import { withAlpha } from "../support/color"
import { useTheme } from "../support/ThemeProvider"

export type InlineAlertTone = "info" | "success" | "warning" | "danger"

interface InlineAlertProps {
  title?: string
  description: ReactNode
  tone?: InlineAlertTone
  action?: ReactNode
  className?: string
}

export const InlineAlert = ({ title, description, tone = "info", action, className }: InlineAlertProps) => {
  const theme = useTheme()

  const paletteMap = useMemo(() => {
    return {
      info: {
        background: withAlpha(theme.colors.info, 0.16),
        border: withAlpha(theme.colors.info, 0.4),
        title: theme.colors.info,
        description: theme.colors.text
      },
      success: {
        background: withAlpha(theme.colors.success, 0.16),
        border: withAlpha(theme.colors.success, 0.4),
        title: theme.colors.success,
        description: theme.colors.text
      },
      warning: {
        background: withAlpha(theme.colors.warning, 0.16),
        border: withAlpha(theme.colors.warning, 0.4),
        title: theme.colors.warning,
        description: theme.colors.text
      },
      danger: {
        background: withAlpha(theme.colors.danger, 0.16),
        border: withAlpha(theme.colors.danger, 0.4),
        title: theme.colors.danger,
        description: theme.colors.text
      }
    } satisfies Record<InlineAlertTone, { background: string; border: string; title: string; description: string }>
  }, [theme])

  const palette = paletteMap[tone]

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
