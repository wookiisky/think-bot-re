import { useState } from "react"
import type { ReactNode } from "react"

import { cn } from "../support/cn"

type TooltipPlacement = "top" | "bottom" | "left" | "right"

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  placement?: TooltipPlacement
  offset?: number
  className?: string
}

export const Tooltip = ({
  content,
  children,
  placement = "top",
  offset = 8,
  className
}: TooltipProps) => {
  const [visible, setVisible] = useState(false)

  const positionStyle = () => {
    if (placement === "top") {
      return {
        left: "50%",
        top: `-${offset}px`,
        transform: "translate(-50%, -100%)"
      }
    }

    if (placement === "bottom") {
      return {
        left: "50%",
        top: `calc(100% + ${offset}px)`,
        transform: "translateX(-50%)"
      }
    }

    if (placement === "left") {
      return {
        left: `-${offset}px`,
        top: "50%",
        transform: "translate(-100%, -50%)"
      }
    }

    return {
      left: `calc(100% + ${offset}px)`,
      top: "50%",
      transform: "translateY(-50%)"
    }
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible ? (
        <div
          className={cn("absolute border px-3 py-1 text-xs uppercase tracking-[0.12em]", className)}
          style={{
            ...positionStyle(),
            backgroundColor: "var(--ui-surface)",
            borderColor: "var(--ui-border)",
            color: "var(--ui-text)",
            boxShadow: "var(--ui-shadow-raised)"
          }}
          role="tooltip"
        >
          {content}
        </div>
      ) : null}
    </div>
  )
}
