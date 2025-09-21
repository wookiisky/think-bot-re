import { createPortal } from "react-dom"
import { useEffect } from "react"
import type { CSSProperties, ReactNode } from "react"

import { cn } from "../support/cn"

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
      style={{ backgroundColor: "rgba(12,17,29,0.52)" }}
      onClick={onClose}
    >
      <div
        className={cn("border px-6 py-4 shadow-xl")}
        style={{
          width: `${width}px`,
          maxWidth: "90vw",
          backgroundColor: "var(--ui-surface)",
          borderColor: "var(--ui-border)"
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <div className="mb-2 text-lg font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ui-text)" }}>
            {title}
          </div>
        ) : null}
        {description ? (
          <div className="mb-4 text-sm" style={{ color: "var(--ui-text-muted)" }}>
            {description}
          </div>
        ) : null}
        {children}
        {footer ? (
          <div className="mt-6 flex items-center justify-end gap-2 border-t pt-3" style={{ borderColor: "var(--ui-border)" }}>
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
        className="border px-4 py-3 shadow-lg"
        style={{ backgroundColor: "var(--ui-surface)", borderColor: "var(--ui-border)" }}
      >
        <div className="mb-3 text-sm" style={{ color: "var(--ui-text)" }}>
          {message}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="border px-3 py-1 text-xs uppercase tracking-[0.12em]"
            style={{ borderColor: "var(--ui-border)", color: "var(--ui-text-muted)", backgroundColor: "var(--ui-surface)" }}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="border px-3 py-1 text-xs uppercase tracking-[0.12em]"
            style={{ borderColor: "#0b63ff", backgroundColor: "#0b63ff", color: "#ffffff" }}
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
