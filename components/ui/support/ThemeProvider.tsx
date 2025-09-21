import { createContext, useContext, useEffect, useMemo } from "react"
import type { ReactNode } from "react"

import { createUiLogger } from "./logger"

export interface ThemeTokens {
  name: string
  colors: {
    background: string
    surface: string
    surfaceStrong: string
    border: string
    borderStrong: string
    primary: string
    primaryText: string
    secondary: string
    secondaryText: string
    text: string
    textMuted: string
    success: string
    warning: string
    danger: string
    info: string
  }
  shadows: {
    raised: string
    overlay: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  font: {
    base: string
    mono: string
  }
}

export type ThemeOverride = Partial<Omit<ThemeTokens, "colors" | "shadows" | "spacing" | "font">> & {
  colors?: Partial<ThemeTokens["colors"]>
  shadows?: Partial<ThemeTokens["shadows"]>
  spacing?: Partial<ThemeTokens["spacing"]>
  font?: Partial<ThemeTokens["font"]>
}

const defaultTokens: ThemeTokens = {
  name: "default",
  colors: {
    background: "#f5f7fb",
    surface: "#ffffff",
    surfaceStrong: "#e7ebf4",
    border: "#d0d7e5",
    borderStrong: "#9aa4b5",
    primary: "#0b63ff",
    primaryText: "#ffffff",
    secondary: "#ff7a1a",
    secondaryText: "#0c111d",
    text: "#0c111d",
    textMuted: "#4f5a6b",
    success: "#1a7f37",
    warning: "#b25e0d",
    danger: "#b42318",
    info: "#2462b5"
  },
  shadows: {
    raised: "0 4px 12px rgba(12, 17, 29, 0.12)",
    overlay: "0 16px 32px rgba(12, 17, 29, 0.28)"
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem"
  },
  font: {
    base: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  }
}

const ThemeContext = createContext<ThemeTokens>(defaultTokens)

const logger = createUiLogger("[theme]")

const mergeTheme = (tokens: ThemeTokens, override?: ThemeOverride) => {
  if (!override) {
    return tokens
  }

  const merged: ThemeTokens = {
    ...tokens,
    ...override,
    colors: {
      ...tokens.colors,
      ...override.colors
    },
    shadows: {
      ...tokens.shadows,
      ...override.shadows
    },
    spacing: {
      ...tokens.spacing,
      ...override.spacing
    },
    font: {
      ...tokens.font,
      ...override.font
    }
  }

  return merged
}

const setThemeVariables = (tokens: ThemeTokens) => {
  if (typeof document === "undefined") {
    return
  }

  const root = document.documentElement
  root.style.setProperty("--ui-background", tokens.colors.background)
  root.style.setProperty("--ui-surface", tokens.colors.surface)
  root.style.setProperty("--ui-surface-strong", tokens.colors.surfaceStrong)
  root.style.setProperty("--ui-border", tokens.colors.border)
  root.style.setProperty("--ui-border-strong", tokens.colors.borderStrong)
  root.style.setProperty("--ui-primary", tokens.colors.primary)
  root.style.setProperty("--ui-primary-text", tokens.colors.primaryText)
  root.style.setProperty("--ui-secondary", tokens.colors.secondary)
  root.style.setProperty("--ui-secondary-text", tokens.colors.secondaryText)
  root.style.setProperty("--ui-text", tokens.colors.text)
  root.style.setProperty("--ui-text-muted", tokens.colors.textMuted)
  root.style.setProperty("--ui-success", tokens.colors.success)
  root.style.setProperty("--ui-warning", tokens.colors.warning)
  root.style.setProperty("--ui-danger", tokens.colors.danger)
  root.style.setProperty("--ui-info", tokens.colors.info)
  root.style.setProperty("--ui-shadow-raised", tokens.shadows.raised)
  root.style.setProperty("--ui-shadow-overlay", tokens.shadows.overlay)
  root.style.setProperty("--ui-font-base", tokens.font.base)
  root.style.setProperty("--ui-font-mono", tokens.font.mono)
}

interface ThemeProviderProps {
  tokens?: ThemeOverride
  children: ReactNode
}

export const ThemeProvider = ({ tokens, children }: ThemeProviderProps) => {
  const merged = useMemo(() => mergeTheme(defaultTokens, tokens), [tokens])

  useEffect(() => {
    logger.info("apply", merged.name)
    setThemeVariables(merged)
  }, [merged])

  return <ThemeContext.Provider value={merged}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  return useContext(ThemeContext)
}
