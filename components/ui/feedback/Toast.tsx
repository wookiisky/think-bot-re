import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"

import { cn } from "../support/cn"
import { withAlpha } from "../support/color"

export type ToastTone = "info" | "success" | "warning" | "danger"

interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  title?: string
  description?: string
  tone?: ToastTone
  duration?: number
  action?: ToastAction
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => string
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

interface ToastProviderProps {
  children: ReactNode
}

const cssVariable = (name: string, fallback: string) => {
  if (typeof document === "undefined") {
    return fallback
  }

  const computed = getComputedStyle(document.documentElement).getPropertyValue(name)
  return computed.trim() || fallback
}

const readThemeSnapshot = () => {
  return {
    surface: cssVariable("--ui-surface", "#ffffff"),
    text: cssVariable("--ui-text", "#0c111d"),
    textMuted: cssVariable("--ui-text-muted", "#4f5a6b"),
    border: cssVariable("--ui-border", "#d0d7e5"),
    info: cssVariable("--ui-info", "#2462b5"),
    success: cssVariable("--ui-success", "#1a7f37"),
    warning: cssVariable("--ui-warning", "#b25e0d"),
    danger: cssVariable("--ui-danger", "#b42318")
  }
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, number>>(new Map())
  const [colors, setColors] = useState(() => readThemeSnapshot())

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    setColors(readThemeSnapshot())

    const observer = new MutationObserver(() => {
      setColors(readThemeSnapshot())
    })

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] })

    return () => {
      observer.disconnect()
    }
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const handle = timers.current.get(id)
    if (handle) {
      window.clearTimeout(handle)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const duration = toast.duration ?? 4000
      setToasts((current) => [
        ...current,
        {
          ...toast,
          id
        }
      ])

      if (duration > 0) {
        const handle = window.setTimeout(() => {
          dismissToast(id)
        }, duration)
        timers.current.set(id, handle)
      }

      return id
    },
    [dismissToast]
  )

  useEffect(() => {
    return () => {
      timers.current.forEach((handle) => window.clearTimeout(handle))
      timers.current.clear()
    }
  }, [])

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])

  const tonePalette = useMemo(() => {
    return {
      info: {
        border: withAlpha(colors.info, 0.4),
        background: withAlpha(colors.info, 0.16),
        title: colors.info,
        description: colors.text
      },
      success: {
        border: withAlpha(colors.success, 0.4),
        background: withAlpha(colors.success, 0.16),
        title: colors.success,
        description: colors.text
      },
      warning: {
        border: withAlpha(colors.warning, 0.4),
        background: withAlpha(colors.warning, 0.16),
        title: colors.warning,
        description: colors.text
      },
      danger: {
        border: withAlpha(colors.danger, 0.4),
        background: withAlpha(colors.danger, 0.16),
        title: colors.danger,
        description: colors.text
      }
    } satisfies Record<ToastTone, { border: string; background: string; title: string; description: string }>
  }, [colors])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 flex w-80 flex-col gap-3">
        {toasts.map((toast) => {
          const palette = tonePalette[toast.tone ?? "info"]
          return (
            <div
              key={toast.id}
              className={cn("border px-4 py-3")}
              style={{
                borderColor: palette.border,
                backgroundColor: palette.background,
                boxShadow: "var(--ui-shadow-raised)"
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  {toast.title ? (
                    <div className="text-sm font-semibold uppercase tracking-[0.08em]" style={{ color: palette.title }}>
                      {toast.title}
                    </div>
                  ) : null}
                  {toast.description ? (
                    <div className="text-sm" style={{ color: palette.description }}>
                      {toast.description}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="text-xs uppercase tracking-[0.12em]"
                  style={{ color: colors.textMuted }}
                  onClick={() => dismissToast(toast.id)}
                >
                  Close
                </button>
              </div>
              {toast.action ? (
                <div className="mt-3">
                  <button
                    type="button"
                    className="border px-3 py-1 text-xs uppercase tracking-[0.12em]"
                    style={{ borderColor: palette.title, color: palette.title }}
                    onClick={() => {
                      toast.action?.onClick()
                      dismissToast(toast.id)
                    }}
                  >
                    {toast.action.label}
                  </button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("ToastProvider is missing in component tree")
  }

  return context
}
