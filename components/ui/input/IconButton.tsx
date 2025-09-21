import { forwardRef } from "react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

import { cn } from "../support/cn"

export type IconButtonTone = "primary" | "secondary" | "neutral" | "danger"
export type IconButtonVariant = "solid" | "ghost" | "outline"
export type IconButtonSize = "sm" | "md" | "lg"

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  tone?: IconButtonTone
  variant?: IconButtonVariant
  size?: IconButtonSize
}

const sizeMap: Record<IconButtonSize, string> = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-12 w-12 text-lg"
}

const tonePalette: Record<IconButtonTone, { bg: string; hover: string; color: string; border: string }> = {
  primary: {
    bg: "#0b63ff",
    hover: "#094fcc",
    color: "#ffffff",
    border: "#094fcc"
  },
  secondary: {
    bg: "#ff7a1a",
    hover: "#e46308",
    color: "#0c111d",
    border: "#e46308"
  },
  neutral: {
    bg: "rgba(12,17,29,0.08)",
    hover: "rgba(12,17,29,0.12)",
    color: "var(--ui-text)",
    border: "var(--ui-border)"
  },
  danger: {
    bg: "#b42318",
    hover: "#8f1d13",
    color: "#ffffff",
    border: "#8f1d13"
  }
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({
    icon,
    label,
    tone = "neutral",
    variant = "ghost",
    size = "md",
    className,
    disabled,
    ...props
  }, ref) => {
    const palette = tonePalette[tone]

    const baseStyle = (() => {
      if (variant === "solid") {
        return {
          backgroundColor: palette.bg,
          color: palette.color,
          borderColor: palette.border
        }
      }

      if (variant === "outline") {
        return {
          backgroundColor: "transparent",
          color: tone === "neutral" ? palette.color : palette.bg,
          borderColor: tone === "neutral" ? palette.border : palette.bg
        }
      }

      return {
        backgroundColor: "transparent",
        color: tone === "neutral" ? palette.color : palette.bg,
        borderColor: "transparent"
      }
    })()

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center border uppercase tracking-[0.12em] transition-all",
          sizeMap[size],
          disabled ? "cursor-not-allowed opacity-60" : "hover:translate-y-[-1px]",
          className
        )}
        style={baseStyle}
        disabled={disabled}
        {...props}
      >
        <span aria-hidden="true">{icon}</span>
      </button>
    )
  }
)

IconButton.displayName = "IconButton"
