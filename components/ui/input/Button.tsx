import { forwardRef } from "react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

import { Spinner } from "../feedback/Spinner"
import { cn } from "../support/cn"

export type ButtonVariant = "solid" | "outline" | "ghost"
export type ButtonTone = "primary" | "secondary" | "neutral" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  tone?: ButtonTone
  size?: ButtonSize
  icon?: ReactNode
  iconPosition?: "left" | "right"
  loading?: boolean
  fullWidth?: boolean
}

const toneStyles: Record<ButtonTone, { background: string; hover: string; color: string; border: string }> = {
  primary: {
    background: "#0b63ff",
    hover: "#094fcc",
    color: "#ffffff",
    border: "#094fcc"
  },
  secondary: {
    background: "#ff7a1a",
    hover: "#e46308",
    color: "#0c111d",
    border: "#e46308"
  },
  neutral: {
    background: "rgba(12,17,29,0.08)",
    hover: "rgba(12,17,29,0.12)",
    color: "var(--ui-text)",
    border: "var(--ui-border)"
  },
  danger: {
    background: "#b42318",
    hover: "#8f1d13",
    color: "#ffffff",
    border: "#8f1d13"
  }
}

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base"
}

const toSpinnerTone = (tone: ButtonTone): "primary" | "secondary" | "neutral" | "danger" => {
  if (tone === "secondary") {
    return "secondary"
  }

  if (tone === "neutral") {
    return "neutral"
  }

  if (tone === "danger") {
    return "danger"
  }

  return "primary"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = "solid",
    tone = "primary",
    size = "md",
    icon,
    iconPosition = "left",
    loading = false,
    disabled,
    fullWidth = false,
    children,
    className,
    ...props
  }, ref) => {
    const palette = toneStyles[tone]

    const baseStyle = (() => {
      if (variant === "solid") {
        return {
          backgroundColor: palette.background,
          color: palette.color,
          borderColor: palette.border
        }
      }

      if (variant === "outline") {
        return {
          backgroundColor: "transparent",
          color: tone === "neutral" ? palette.color : palette.background,
          borderColor: tone === "neutral" ? palette.border : palette.background
        }
      }

      return {
        backgroundColor: "transparent",
        color: tone === "neutral" ? palette.color : palette.background,
        borderColor: "transparent"
      }
    })()

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 border uppercase tracking-[0.12em] transition-all",
          sizeClassMap[size],
          fullWidth ? "w-full" : "",
          disabled || loading ? "cursor-not-allowed opacity-60" : "hover:translate-y-[-1px]",
          className
        )}
        style={baseStyle}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Spinner size="sm" tone={toSpinnerTone(tone)} /> : null}
        {!loading && icon && iconPosition === "left" ? <span className="text-sm">{icon}</span> : null}
        <span className="truncate">{children}</span>
        {!loading && icon && iconPosition === "right" ? <span className="text-sm">{icon}</span> : null}
      </button>
    )
  }
)

Button.displayName = "Button"
