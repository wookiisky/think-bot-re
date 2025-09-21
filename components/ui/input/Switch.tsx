import type { ButtonHTMLAttributes } from "react"

import { cn } from "../support/cn"
import { darken, withAlpha } from "../support/color"
import { useTheme } from "../support/ThemeProvider"

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: "sm" | "md"
}

export const Switch = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  size = "md",
  className,
  ...props
}: SwitchProps) => {
  const theme = useTheme()
  const trackClass = size === "sm" ? "w-10 h-5" : "w-12 h-6"
  const knobSize = size === "sm" ? 16 : 20
  const trackPadding = 2
  const trackWidth = size === "sm" ? 40 : 48
  const offset = checked ? trackWidth - knobSize - trackPadding : trackPadding

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn("flex items-center gap-3", className)}
      {...props}
    >
      <span
        className={cn("relative border", trackClass, disabled ? "opacity-60" : "")}
        style={{
          borderColor: checked ? darken(theme.colors.primary, 0.16) : theme.colors.border,
          backgroundColor: checked ? theme.colors.primary : withAlpha(theme.colors.text, 0.12),
          borderRadius: 0
        }}
      >
        <span
          className="absolute top-1/2 -translate-y-1/2 border"
          style={{
            transform: `translateX(${offset}px)`,
            width: `${knobSize}px`,
            height: `${knobSize}px`,
            borderColor: checked ? darken(theme.colors.primary, 0.16) : theme.colors.border,
            backgroundColor: theme.colors.surface
          }}
        />
      </span>
      <span className="flex flex-col text-left">
        {label ? (
          <span className="text-xs uppercase tracking-[0.1em]" style={{ color: "var(--ui-text)" }}>
            {label}
          </span>
        ) : null}
        {description ? (
          <span className="text-xs" style={{ color: "var(--ui-text-muted)" }}>
            {description}
          </span>
        ) : null}
      </span>
    </button>
  )
}
