import { useMemo } from "react"

import type { ThemeTokens } from "./ThemeProvider"
import { useTheme } from "./ThemeProvider"
import { darken, readableTextColor, withAlpha } from "./color"

export type ToneKey = "primary" | "secondary" | "neutral" | "danger"

interface ToneVariantStyle {
  background: string
  border: string
  color: string
  hoverBackground: string
}

export type TonePalette = Record<"solid" | "outline" | "ghost", ToneVariantStyle>

const buildPalette = (colors: ThemeTokens["colors"]): Record<ToneKey, TonePalette> => {
  const primaryText = colors.primaryText
  const secondaryText = colors.secondaryText ?? readableTextColor(colors.secondary)
  const neutralHover = withAlpha(colors.text, 0.12)
  const neutralGhost = withAlpha(colors.text, 0.08)
  const dangerText = readableTextColor(colors.danger)

  return {
    primary: {
      solid: {
        background: colors.primary,
        border: darken(colors.primary, 0.16),
        color: primaryText,
        hoverBackground: darken(colors.primary, 0.12)
      },
      outline: {
        background: "transparent",
        border: colors.primary,
        color: colors.primary,
        hoverBackground: withAlpha(colors.primary, 0.16)
      },
      ghost: {
        background: "transparent",
        border: "transparent",
        color: colors.primary,
        hoverBackground: withAlpha(colors.primary, 0.16)
      }
    },
    secondary: {
      solid: {
        background: colors.secondary,
        border: darken(colors.secondary, 0.18),
        color: secondaryText,
        hoverBackground: darken(colors.secondary, 0.12)
      },
      outline: {
        background: "transparent",
        border: colors.secondary,
        color: colors.secondary,
        hoverBackground: withAlpha(colors.secondary, 0.18)
      },
      ghost: {
        background: "transparent",
        border: "transparent",
        color: colors.secondary,
        hoverBackground: withAlpha(colors.secondary, 0.18)
      }
    },
    neutral: {
      solid: {
        background: withAlpha(colors.text, 0.08),
        border: colors.border,
        color: colors.text,
        hoverBackground: neutralHover
      },
      outline: {
        background: "transparent",
        border: colors.border,
        color: colors.text,
        hoverBackground: neutralGhost
      },
      ghost: {
        background: "transparent",
        border: "transparent",
        color: colors.text,
        hoverBackground: neutralGhost
      }
    },
    danger: {
      solid: {
        background: colors.danger,
        border: darken(colors.danger, 0.18),
        color: dangerText,
        hoverBackground: darken(colors.danger, 0.12)
      },
      outline: {
        background: "transparent",
        border: colors.danger,
        color: colors.danger,
        hoverBackground: withAlpha(colors.danger, 0.18)
      },
      ghost: {
        background: "transparent",
        border: "transparent",
        color: colors.danger,
        hoverBackground: withAlpha(colors.danger, 0.18)
      }
    }
  }
}

export const useTonePalettes = () => {
  const theme = useTheme()

  return useMemo(() => buildPalette(theme.colors), [theme])
}

export const createTonePalette = buildPalette
