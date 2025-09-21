import { useEffect } from "react"
import type { ReactNode } from "react"

import { ThemeProvider, type ThemeOverride } from "../support/ThemeProvider"
import { cn } from "../support/cn"
import { createUiLogger } from "../support/logger"

type SidebarPosition = "left" | "right"

interface AppShellProps {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
  sidebar?: ReactNode
  sidebarPosition?: SidebarPosition
  className?: string
  theme?: ThemeOverride
  background?: "default" | "surface"
}

const logger = createUiLogger("[app-shell]")

export const AppShell = ({
  children,
  header,
  footer,
  sidebar,
  sidebarPosition = "left",
  className,
  theme,
  background = "default"
}: AppShellProps) => {
  useEffect(() => {
    logger.info("mount")
    return () => {
      logger.info("unmount")
    }
  }, [])

  const backgroundColor = background === "surface" ? "var(--ui-surface)" : "var(--ui-background)"

  const shell = (
    <div
      className={cn("min-h-screen min-w-[320px] antialiased", className)}
      style={{
        backgroundColor,
        color: "var(--ui-text)",
        fontFamily: "var(--ui-font-base)"
      }}
    >
      {header ? (
        <header
          className="border-b px-4 py-3 text-sm font-medium uppercase tracking-[0.08em]"
          style={{
            backgroundColor: "var(--ui-surface-strong)",
            borderColor: "var(--ui-border-strong)"
          }}
        >
          {header}
        </header>
      ) : null}
      <div className="flex" data-shell-content="true">
        {sidebar && sidebarPosition === "left" ? (
          <aside
            className="w-72 border-r px-4 py-4"
            style={{
              backgroundColor: "var(--ui-surface)",
              borderColor: "var(--ui-border-strong)"
            }}
          >
            {sidebar}
          </aside>
        ) : null}
        <main className="flex-1 px-4 py-4">
          <div className="mx-auto max-w-5xl space-y-4" data-shell-main="true">
            {children}
          </div>
        </main>
        {sidebar && sidebarPosition === "right" ? (
          <aside
            className="w-72 border-l px-4 py-4"
            style={{
              backgroundColor: "var(--ui-surface)",
              borderColor: "var(--ui-border-strong)"
            }}
          >
            {sidebar}
          </aside>
        ) : null}
      </div>
      {footer ? (
        <footer
          className="border-t px-4 py-3 text-xs"
          style={{
            backgroundColor: "var(--ui-surface-strong)",
            borderColor: "var(--ui-border-strong)",
            color: "var(--ui-text-muted)"
          }}
        >
          {footer}
        </footer>
      ) : null}
    </div>
  )

  return <ThemeProvider tokens={theme}>{shell}</ThemeProvider>
}
