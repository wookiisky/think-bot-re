import { Children } from "react"
import type { ReactNode } from "react"

import { cn } from "../support/cn"

export type StackGap = "xs" | "sm" | "md" | "lg" | "xl"

const gapClassMap: Record<StackGap, string> = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
  xl: "gap-6"
}

interface StackProps {
  children: ReactNode
  gap?: StackGap
  align?: "start" | "center" | "end" | "stretch"
  className?: string
  divider?: ReactNode
}

const renderWithDivider = (children: ReactNode, divider?: ReactNode) => {
  if (!divider) {
    return children
  }

  const nodes = Children.toArray(children)
  return nodes.flatMap((child, index) => {
    if (index === 0) {
      return child
    }

    return [divider, child]
  })
}

export const Stack = ({
  children,
  gap = "md",
  align = "stretch",
  className,
  divider
}: StackProps) => {
  const alignClass = align === "stretch" ? "items-stretch" : `items-${align}`

  return (
    <div className={cn("flex flex-col", gapClassMap[gap], alignClass, className)}>
      {renderWithDivider(children, divider)}
    </div>
  )
}

interface InlineStackProps extends StackProps {
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  wrap?: boolean
}

export const InlineStack = ({
  children,
  gap = "md",
  align = "center",
  justify = "start",
  className,
  divider,
  wrap = false
}: InlineStackProps) => {
  const alignClass = align === "stretch" ? "items-stretch" : `items-${align}`
  const justifyClass = justify === "start" ? "justify-start" : `justify-${justify}`

  return (
    <div
      className={cn(
        "flex",
        wrap ? "flex-wrap" : "flex-nowrap",
        gapClassMap[gap],
        alignClass,
        justifyClass,
        className
      )}
    >
      {renderWithDivider(children, divider)}
    </div>
  )
}
