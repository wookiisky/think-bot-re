import type { CSSProperties } from "react"

import { Icon } from "../display/Icon"
import { cn } from "../support/cn"
import { darken, withAlpha } from "../support/color"
import { useTheme } from "../support/ThemeProvider"

interface ButtonSelectOption {
  id: string
  label: string
  icon?: string
  tooltip?: string
}

interface ButtonSelectProps {
  options: ButtonSelectOption[]
  selectedId?: string
  onSelect: (id: string) => void
  allowDeselect?: boolean
}

export const ButtonSelect = ({
  options,
  selectedId,
  onSelect,
  allowDeselect = false
}: ButtonSelectProps) => {
  const theme = useTheme()

  const activeStyle: CSSProperties & { "--button-select-hover"?: string } = {
    backgroundColor: theme.colors.primary,
    color: theme.colors.primaryText,
    borderColor: darken(theme.colors.primary, 0.16),
    "--button-select-hover": darken(theme.colors.primary, 0.12)
  }

  const idleStyle: CSSProperties & { "--button-select-hover"?: string } = {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderColor: theme.colors.border,
    "--button-select-hover": withAlpha(theme.colors.primary, 0.16)
  }

  return (
    <div className="flex items-center gap-2">
      {options.map((option) => {
        const isActive = option.id === selectedId
        const style = isActive ? activeStyle : idleStyle
        return (
          <button
            key={option.id}
            type="button"
            title={option.tooltip ?? option.label}
            className={cn(
              "flex h-10 w-10 items-center justify-center border text-xs uppercase tracking-[0.12em] transition-all",
              "hover:translate-y-[-1px]",
              "hover:bg-[var(--button-select-hover)]"
            )}
            style={style}
            onClick={() => {
              if (allowDeselect && isActive) {
                onSelect("")
                return
              }
              onSelect(option.id)
            }}
          >
            {option.icon ? <Icon name={option.icon} ariaHidden /> : option.label}
          </button>
        )
      })}
    </div>
  )
}
