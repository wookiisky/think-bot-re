import type { CSSProperties } from "react"

import { Icon } from "../display/Icon"
import { cn } from "../support/cn"
import { darken, withAlpha } from "../support/color"
import { useTheme } from "../support/ThemeProvider"

interface ButtonSwitchProps {
  checked: boolean
  onToggle: (next: boolean) => void
  iconOn?: string
  iconOff?: string
  label?: string
  tooltipOn?: string
  tooltipOff?: string
  disabled?: boolean
}

export const ButtonSwitch = ({
  checked,
  onToggle,
  iconOn = "toggle_on",
  iconOff = "toggle_off",
  label,
  tooltipOn,
  tooltipOff,
  disabled = false
}: ButtonSwitchProps) => {
  const theme = useTheme()

  const activeStyle: CSSProperties & { "--button-switch-hover"?: string } = {
    backgroundColor: theme.colors.primary,
    color: theme.colors.primaryText,
    borderColor: darken(theme.colors.primary, 0.16),
    "--button-switch-hover": darken(theme.colors.primary, 0.12)
  }

  const inactiveStyle: CSSProperties & { "--button-switch-hover"?: string } = {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderColor: theme.colors.border,
    "--button-switch-hover": withAlpha(theme.colors.primary, 0.16)
  }

  const style = checked ? activeStyle : inactiveStyle
  const hoverClass = !disabled ? "hover:bg-[var(--button-switch-hover)]" : ""

  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-10 items-center justify-center border text-xs uppercase tracking-[0.12em]",
        disabled ? "cursor-not-allowed opacity-60" : cn("hover:translate-y-[-1px]", hoverClass)
      )}
      style={style}
      onClick={() => onToggle(!checked)}
      title={checked ? tooltipOn ?? label : tooltipOff ?? label}
      disabled={disabled}
    >
      <Icon name={checked ? iconOn : iconOff} ariaHidden />
      <span className="sr-only">{label}</span>
    </button>
  )
}
