import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"

import { cn } from "../support/cn"

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

const tonePalette: Record<ToastTone, { border: string; background: string; title: string; description: string }> = {
  info: {
    border: "rgba(36,98,181,0.4)",
    background: "rgba(36,98,181,0.12)",
    title: "var(--ui-info)",
    description: "var(--ui-text)"
  },
  success: {
    border: "rgba(26,127,55,0.4)",
    background: "rgba(26,127,55,0.12)",
    title: "var(--ui-success)",
    description: "var(--ui-text)"
  },
  warning: {
    border: "rgba(178,94,13,0.4)",
    background: "rgba(178,94,13,0.12)",
    title: "var(--ui-warning)",
    description: "var(--ui-text)"
  },
  danger: {
    border: "rgba(180,35,24,0.4)",
    background: "rgba(180,35,24,0.12)",
    title: "var(--ui-danger)",
    description: "var(--ui-text)"
  }
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, number>>(new Map())

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

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 flex w-80 flex-col gap-3">
        {toasts.map((toast) => {
          const palette = tonePalette[toast.tone ?? "info"]
          return (
            <div
              key={toast.id}
              className={cn("border px-4 py-3 shadow-lg")}
              style={{
                borderColor: palette.border,
                backgroundColor: palette.background
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
                  style={{ color: "var(--ui-text-muted)" }}
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
