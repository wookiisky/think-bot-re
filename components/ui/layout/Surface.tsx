import type { ReactNode } from "react"

import { cn } from "../support/cn"

interface SurfaceProps {
  children: ReactNode
  className?: string
  title?: ReactNode
  actions?: ReactNode
  padding?: "none" | "sm" | "md" | "lg"
  elevation?: "flat" | "raised"
}

const paddingMap: Record<Exclude<SurfaceProps["padding"], undefined>, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6"
}

export const Surface = ({
  children,
  className,
  title,
  actions,
  padding = "md",
  elevation = "flat"
}: SurfaceProps) => {
  const paddingClass = paddingMap[padding]

  return (
    <section
      className={cn("border", paddingClass, className)}
      style={{
        backgroundColor: "var(--ui-surface)",
        borderColor: "var(--ui-border)",
        boxShadow: elevation === "raised" ? "var(--ui-shadow-raised)" : "none"
      }}
    >
      {(title || actions) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          {title ? <div className="text-sm font-semibold uppercase tracking-[0.08em]">{title}</div> : null}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      )}
      {children}
    </section>
  )
}

interface PanelProps extends SurfaceProps {
  subdued?: boolean
}

export const Panel = ({ subdued = false, ...props }: PanelProps) => {
  return (
    <Surface
      {...props}
      className={cn(subdued ? "border-dashed" : "border-solid", props.className)}
      elevation={subdued ? "flat" : props.elevation}
    />
  )
}
