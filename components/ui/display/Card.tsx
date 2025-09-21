import type { ReactNode } from "react"

import { Surface } from "../layout/Surface"
import { Typography } from "./Typography"

interface CardProps {
  title?: string
  description?: string
  actions?: ReactNode
  footer?: ReactNode
  children: ReactNode
  compact?: boolean
}

export const Card = ({
  title,
  description,
  actions,
  footer,
  children,
  compact = false
}: CardProps) => {
  return (
    <Surface
      padding={compact ? "sm" : "md"}
      title={title ? <Typography variant="title" as="h3">{title}</Typography> : undefined}
      actions={actions}
      elevation="flat"
    >
      {description ? (
        <Typography variant="muted" className="mb-3">
          {description}
        </Typography>
      ) : null}
      <div className="space-y-3">{children}</div>
      {footer ? (
        <footer className="mt-4 border-t pt-3" style={{ borderColor: "var(--ui-border)" }}>
          {footer}
        </footer>
      ) : null}
    </Surface>
  )
}
