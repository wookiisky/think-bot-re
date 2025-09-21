import type { ReactNode } from "react"

import { cn } from "../support/cn"

type TypographyVariant = "display" | "heading" | "title" | "subtitle" | "body" | "muted" | "caption"

type Align = "start" | "center" | "end" | "justify"

interface TypographyProps {
  variant?: TypographyVariant
  children: ReactNode
  align?: Align
  className?: string
  as?: keyof JSX.IntrinsicElements
}

const variantClassMap: Record<TypographyVariant, string> = {
  display: "text-2xl font-semibold tracking-[0.08em] uppercase",
  heading: "text-xl font-semibold",
  title: "text-lg font-medium",
  subtitle: "text-base font-medium",
  body: "text-sm leading-relaxed",
  muted: "text-sm",
  caption: "text-xs uppercase tracking-[0.1em]"
}

export const Typography = ({
  variant = "body",
  children,
  align = "start",
  className,
  as
}: TypographyProps) => {
  const Component = as ?? "p"
  const color =
    variant === "muted" || variant === "caption" || variant === "subtitle"
      ? "var(--ui-text-muted)"
      : "var(--ui-text)"

  return (
    <Component
      className={cn(
        variantClassMap[variant],
        align === "justify" ? "text-justify" : `text-${align}`,
        className
      )}
      style={{
        color,
        fontFamily: "var(--ui-font-base)"
      }}
    >
      {children}
    </Component>
  )
}
