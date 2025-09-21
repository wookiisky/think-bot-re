import type { ReactNode } from "react"

import { cn } from "../support/cn"

type Breakpoint = "base" | "sm" | "md" | "lg" | "xl"
type GridGap = "xs" | "sm" | "md" | "lg" | "xl"

interface ResponsiveGridProps {
  children: ReactNode
  columns?: Partial<Record<Breakpoint, 1 | 2 | 3 | 4>>
  gap?: GridGap
  className?: string
}

const gapClassMap: Record<GridGap, string> = {
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8"
}

const breakpointClass = (breakpoint: Breakpoint, columns: number) => {
  const columnClass = `grid-cols-${columns}`
  if (breakpoint === "base") {
    return columnClass
  }

  return `${breakpoint}:${columnClass}`
}

export const ResponsiveGrid = ({
  children,
  columns = {
    base: 1,
    md: 2,
    lg: 3
  },
  gap = "md",
  className
}: ResponsiveGridProps) => {
  const classes = Object.entries(columns)
    .map(([breakpoint, cols]) => breakpointClass(breakpoint as Breakpoint, cols))
    .join(" ")

  return <div className={cn("grid", gapClassMap[gap], classes, className)}>{children}</div>
}
