import { useMemo } from "react"

import { cn } from "../support/cn"
import { withAlpha } from "../support/color"
import { useTheme } from "../support/ThemeProvider"

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger"

interface StatusBadgeProps {
  tone?: StatusTone
  label: string
  pulse?: boolean
  className?: string
}

export const StatusBadge = ({ tone = "neutral", label, pulse = false, className }: StatusBadgeProps) => {
  const theme = useTheme()

  const paletteMap = useMemo(() => {
    return {
      neutral: {
        background: withAlpha(theme.colors.text, 0.08),
        color: theme.colors.text,
        border: theme.colors.border
      },
      info: {
        background: withAlpha(theme.colors.info, 0.16),
        color: theme.colors.info,
        border: withAlpha(theme.colors.info, 0.4)
      },
      success: {
        background: withAlpha(theme.colors.success, 0.16),
        color: theme.colors.success,
        border: withAlpha(theme.colors.success, 0.4)
      },
      warning: {
        background: withAlpha(theme.colors.warning, 0.16),
        color: theme.colors.warning,
        border: withAlpha(theme.colors.warning, 0.4)
      },
      danger: {
        background: withAlpha(theme.colors.danger, 0.16),
        color: theme.colors.danger,
        border: withAlpha(theme.colors.danger, 0.4)
      }
    } satisfies Record<StatusTone, { background: string; color: string; border: string }>
  }, [theme])

  const palette = paletteMap[tone]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border px-3 py-1 text-xs uppercase tracking-[0.12em]",
        pulse ? "animate-pulse" : "",
        className
      )}
      style={{
        backgroundColor: palette.background,
        borderColor: palette.border,
        color: palette.color
      }}
    >
      <span className="h-2 w-2 border" style={{ borderColor: palette.color, backgroundColor: palette.color }} />
      {label}
    </span>
  )
}
