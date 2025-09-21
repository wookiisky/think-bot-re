import { forwardRef } from "react"
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react"

import { Spinner } from "../feedback/Spinner"
import { cn } from "../support/cn"
import { useTonePalettes } from "../support/palette"

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
    const palettes = useTonePalettes()
    const tonePalette = palettes[tone]
    const variantPalette =
      variant === "solid"
        ? tonePalette.solid
        : variant === "outline"
          ? tonePalette.outline
          : tonePalette.ghost

    const style: CSSProperties & { "--btn-hover"?: string } = {
      backgroundColor: variantPalette.background,
      color: variantPalette.color,
      borderColor: variantPalette.border
    }

    if (variantPalette.hoverBackground) {
      style["--btn-hover"] = variantPalette.hoverBackground
    }

    const hoverClass =
      !disabled && !loading && variantPalette.hoverBackground ? "hover:bg-[var(--btn-hover)]" : ""

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 border uppercase tracking-[0.12em] transition-all",
          sizeClassMap[size],
          fullWidth ? "w-full" : "",
          disabled || loading ? "cursor-not-allowed opacity-60" : cn("hover:translate-y-[-1px]", hoverClass),
          className
        )}
        style={style}
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
