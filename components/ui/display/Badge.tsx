import { useMemo } from "react"
import type { ReactNode } from "react"

import { cn } from "../support/cn"
import { withAlpha } from "../support/color"
import { useTheme } from "../support/ThemeProvider"

type BadgeTone = "default" | "primary" | "info" | "success" | "warning" | "danger"

type BadgeSize = "sm" | "md"

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  size?: BadgeSize
  icon?: ReactNode
  className?: string
}

const sizeClassMap: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs"
}

export const Badge = ({
  children,
  tone = "default",
  size = "md",
  icon,
  className
}: BadgeProps) => {
  const theme = useTheme()

  const paletteMap = useMemo(() => {
    return {
      default: {
        background: withAlpha(theme.colors.text, 0.06),
        text: theme.colors.text,
        border: theme.colors.border
      },
      primary: {
        background: withAlpha(theme.colors.primary, 0.16),
        text: theme.colors.primary,
        border: withAlpha(theme.colors.primary, 0.4)
      },
      info: {
        background: withAlpha(theme.colors.info, 0.16),
        text: theme.colors.info,
        border: withAlpha(theme.colors.info, 0.4)
      },
      success: {
        background: withAlpha(theme.colors.success, 0.16),
        text: theme.colors.success,
        border: withAlpha(theme.colors.success, 0.4)
      },
      warning: {
        background: withAlpha(theme.colors.warning, 0.16),
        text: theme.colors.warning,
        border: withAlpha(theme.colors.warning, 0.4)
      },
      danger: {
        background: withAlpha(theme.colors.danger, 0.16),
        text: theme.colors.danger,
        border: withAlpha(theme.colors.danger, 0.4)
      }
    } satisfies Record<BadgeTone, { background: string; text: string; border: string }>
  }, [theme])

  const palette = paletteMap[tone]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border uppercase tracking-[0.12em]",
        sizeClassMap[size],
        className
      )}
      style={{
        backgroundColor: palette.background,
        color: palette.text,
        borderColor: palette.border
      }}
    >
      {icon ? <span className="text-[10px]">{icon}</span> : null}
      {children}
    </span>
  )
}
