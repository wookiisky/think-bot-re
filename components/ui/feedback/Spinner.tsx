import type { CSSProperties } from "react"

import { cn } from "../support/cn"

type SpinnerTone = "primary" | "secondary" | "neutral" | "danger"

type SpinnerSize = "sm" | "md" | "lg" | number

interface SpinnerProps {
  size?: SpinnerSize
  tone?: SpinnerTone
  className?: string
  label?: string
}

const toneColor: Record<SpinnerTone, string> = {
  primary: "#0b63ff",
  secondary: "#ff7a1a",
  neutral: "var(--ui-border-strong)",
  danger: "#b42318"
}

const sizeToStyle = (size: SpinnerSize): CSSProperties => {
  if (typeof size === "number") {
    return {
      width: `${size}px`,
      height: `${size}px`
    }
  }

  if (size === "sm") {
    return {
      width: "16px",
      height: "16px"
    }
  }

  if (size === "lg") {
    return {
      width: "32px",
      height: "32px"
    }
  }

  return {
    width: "24px",
    height: "24px"
  }
}

export const Spinner = ({ size = "md", tone = "primary", className, label }: SpinnerProps) => {
  const style = sizeToStyle(size)
  const color = toneColor[tone]

  return (
    <div className={cn("inline-flex items-center gap-2", className)} role="status">
      <span
        className="inline-block animate-spin rounded-full border-[3px] border-solid border-transparent"
        style={{
          ...style,
          borderTopColor: color,
          borderRightColor: color
        }}
      />
      {label ? (
        <span className="text-xs uppercase tracking-[0.1em]" style={{ color: "var(--ui-text-muted)" }}>
          {label}
        </span>
      ) : null}
    </div>
  )
}

interface ProgressIndicatorProps {
  value?: number
  tone?: "primary" | "secondary" | "danger"
  className?: string
  label?: string
  indeterminate?: boolean
}

const progressTone: Record<NonNullable<ProgressIndicatorProps["tone"]>, string> = {
  primary: "#0b63ff",
  secondary: "#ff7a1a",
  danger: "#b42318"
}

export const ProgressIndicator = ({
  value = 0,
  tone = "primary",
  className,
  label,
  indeterminate = false
}: ProgressIndicatorProps) => {
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs" style={{ color: "var(--ui-text-muted)" }}>
          <span>{label}</span>
          {!indeterminate ? <span>{Math.round(value)}%</span> : null}
        </div>
      ) : null}
      <div className="h-2 border" style={{ borderColor: "var(--ui-border)", backgroundColor: "rgba(12,17,29,0.06)" }}>
        <div
          className={cn("h-full", indeterminate ? "animate-pulse" : "")}
          style={{
            width: indeterminate ? "35%" : `${Math.min(100, Math.max(0, value))}%`,
            backgroundColor: progressTone[tone]
          }}
        />
      </div>
    </div>
  )
}
