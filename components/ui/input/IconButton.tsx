import { forwardRef } from "react"
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react"

import { cn } from "../support/cn"
import { useTonePalettes } from "../support/palette"

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
    const palettes = useTonePalettes()
    const tonePalette = palettes[tone]
    const variantPalette =
      variant === "solid"
        ? tonePalette.solid
        : variant === "outline"
          ? tonePalette.outline
          : tonePalette.ghost

    const style: CSSProperties & { "--icon-button-hover"?: string } = {
      backgroundColor: variantPalette.background,
      color: variantPalette.color,
      borderColor: variantPalette.border
    }

    if (variantPalette.hoverBackground) {
      style["--icon-button-hover"] = variantPalette.hoverBackground
    }

    const hoverClass = !disabled && variantPalette.hoverBackground ? "hover:bg-[var(--icon-button-hover)]" : ""

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center border uppercase tracking-[0.12em] transition-all",
          sizeMap[size],
          disabled ? "cursor-not-allowed opacity-60" : cn("hover:translate-y-[-1px]", hoverClass),
          className
        )}
        style={style}
        disabled={disabled}
        {...props}
      >
        <span aria-hidden="true">{icon}</span>
      </button>
    )
  }
)

IconButton.displayName = "IconButton"
