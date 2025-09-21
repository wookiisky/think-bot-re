import type { CSSProperties } from "react"

import { cn } from "../support/cn"

type IconSize = "sm" | "md" | "lg" | number

interface IconProps {
  name: string
  size?: IconSize
  className?: string
  title?: string
  ariaHidden?: boolean
}

const sizeToStyle = (size: IconSize): CSSProperties => {
  if (typeof size === "number") {
    return { fontSize: `${size}px`, lineHeight: 1 }
  }

  if (size === "sm") {
    return { fontSize: "16px", lineHeight: 1 }
  }

  if (size === "lg") {
    return { fontSize: "24px", lineHeight: 1 }
  }

  return { fontSize: "20px", lineHeight: 1 }
}

export const Icon = ({
  name,
  size = "md",
  className,
  title,
  ariaHidden = true
}: IconProps) => {
  return (
    <span
      role="img"
      className={cn("material-symbols-outlined select-none", className)}
      style={{
        ...sizeToStyle(size),
        color: "currentColor"
      }}
      title={title}
      aria-hidden={ariaHidden}
    >
      {name}
    </span>
  )
}
