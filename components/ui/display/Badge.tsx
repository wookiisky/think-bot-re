import type { ReactNode } from "react"

import { cn } from "../support/cn"

type BadgeTone = "default" | "primary" | "info" | "success" | "warning" | "danger"

type BadgeSize = "sm" | "md"

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  size?: BadgeSize
  icon?: ReactNode
  className?: string
}

const toneColorMap: Record<BadgeTone, { background: string; text: string; border: string }> = {
  default: {
    background: "rgba(12,17,29,0.06)",
    text: "var(--ui-text)",
    border: "var(--ui-border)"
  },
  primary: {
    background: "rgba(11,99,255,0.12)",
    text: "#0b63ff",
    border: "rgba(11,99,255,0.4)"
  },
  info: {
    background: "rgba(36,98,181,0.12)",
    text: "var(--ui-info)",
    border: "rgba(36,98,181,0.4)"
  },
  success: {
    background: "rgba(26,127,55,0.12)",
    text: "var(--ui-success)",
    border: "rgba(26,127,55,0.4)"
  },
  warning: {
    background: "rgba(178,94,13,0.12)",
    text: "var(--ui-warning)",
    border: "rgba(178,94,13,0.4)"
  },
  danger: {
    background: "rgba(180,35,24,0.12)",
    text: "var(--ui-danger)",
    border: "rgba(180,35,24,0.4)"
  }
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
  const palette = toneColorMap[tone]

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
