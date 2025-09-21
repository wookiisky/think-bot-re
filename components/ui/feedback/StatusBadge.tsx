import { cn } from "../support/cn"

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger"

interface StatusBadgeProps {
  tone?: StatusTone
  label: string
  pulse?: boolean
  className?: string
}

const tonePalette: Record<StatusTone, { background: string; color: string; border: string }> = {
  neutral: {
    background: "rgba(12,17,29,0.08)",
    color: "var(--ui-text)",
    border: "var(--ui-border)"
  },
  info: {
    background: "rgba(36,98,181,0.12)",
    color: "var(--ui-info)",
    border: "rgba(36,98,181,0.4)"
  },
  success: {
    background: "rgba(26,127,55,0.12)",
    color: "var(--ui-success)",
    border: "rgba(26,127,55,0.4)"
  },
  warning: {
    background: "rgba(178,94,13,0.12)",
    color: "var(--ui-warning)",
    border: "rgba(178,94,13,0.4)"
  },
  danger: {
    background: "rgba(180,35,24,0.12)",
    color: "var(--ui-danger)",
    border: "rgba(180,35,24,0.4)"
  }
}

export const StatusBadge = ({ tone = "neutral", label, pulse = false, className }: StatusBadgeProps) => {
  const palette = tonePalette[tone]

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
