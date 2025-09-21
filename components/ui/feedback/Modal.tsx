import { createPortal } from "react-dom"
import { useEffect } from "react"
import type { CSSProperties, ReactNode } from "react"

import { cn } from "../support/cn"
import { darken, withAlpha } from "../support/color"
import { useTheme } from "../support/ThemeProvider"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: ReactNode
  footer?: ReactNode
  children?: ReactNode
  width?: number
}

const overlayRoot = () => {
  if (typeof document === "undefined") {
    return null
  }

  let root = document.getElementById("thinkbot-modal-root")
  if (!root) {
    root = document.createElement("div")
    root.id = "thinkbot-modal-root"
    document.body.appendChild(root)
  }

  return root
}

export const Modal = ({ open, onClose, title, description, footer, children, width = 480 }: ModalProps) => {
  const theme = useTheme()

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose])

  const target = overlayRoot()
  if (!open || !target) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: withAlpha(theme.colors.text, 0.58) }}
      onClick={onClose}
    >
      <div
        className={cn("border px-6 py-4")}
        style={{
          width: `${width}px`,
          maxWidth: "90vw",
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          boxShadow: "var(--ui-shadow-overlay)"
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <div className="mb-2 text-lg font-semibold uppercase tracking-[0.08em]" style={{ color: theme.colors.text }}>
            {title}
          </div>
        ) : null}
        {description ? (
          <div className="mb-4 text-sm" style={{ color: theme.colors.textMuted }}>
            {description}
          </div>
        ) : null}
        {children}
        {footer ? (
          <div className="mt-6 flex items-center justify-end gap-2 border-t pt-3" style={{ borderColor: theme.colors.border }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    target
  )
}

interface MiniConfirmModalProps {
  open: boolean
  anchorRect?: DOMRect
  onConfirm: () => void
  onCancel: () => void
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

export const MiniConfirmModal = ({
  open,
  anchorRect,
  onConfirm,
  onCancel,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel"
}: MiniConfirmModalProps) => {
  const theme = useTheme()

  const target = overlayRoot()
  if (!open || !target) {
    return null
  }

  const style: CSSProperties = anchorRect
    ? {
        position: "absolute",
        top: `${anchorRect.bottom + 8}px`,
        left: `${anchorRect.left}px`
      }
    : {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)"
      }

  return createPortal(
    <div style={style} className="z-50" onClick={(event) => event.stopPropagation()}>
      <div
        className="border px-4 py-3"
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          boxShadow: "var(--ui-shadow-raised)"
        }}
      >
        <div className="mb-3 text-sm" style={{ color: theme.colors.text }}>
          {message}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="border px-3 py-1 text-xs uppercase tracking-[0.12em]"
            style={{
              borderColor: theme.colors.border,
              color: theme.colors.textMuted,
              backgroundColor: theme.colors.surface
            }}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="border px-3 py-1 text-xs uppercase tracking-[0.12em]"
            style={{
              borderColor: darken(theme.colors.primary, 0.16),
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryText
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    target
  )
}
