import { useState } from "react"
import type { ReactNode } from "react"

import { Icon } from "./Icon"
import { cn } from "../support/cn"

interface MediaPreviewProps {
  src: string
  alt?: string
  onRemove?: () => void
  overlay?: ReactNode
  className?: string
  size?: number
  removable?: boolean
}

export const MediaPreview = ({
  src,
  alt,
  onRemove,
  overlay,
  className,
  size = 96,
  removable = true
}: MediaPreviewProps) => {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      className={cn("relative border", className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderColor: "var(--ui-border)",
        backgroundColor: "rgba(12,17,29,0.06)"
      }}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0.6 }}
      />
      {overlay ? (
        <div
          className="absolute inset-x-0 bottom-0 border-t px-2 py-1 text-[10px] uppercase tracking-[0.12em]"
          style={{
            borderColor: "var(--ui-border)",
            backgroundColor: "rgba(12,17,29,0.75)",
            color: "#ffffff"
          }}
        >
          {overlay}
        </div>
      ) : null}
      {removable ? (
        <button
          type="button"
          className="absolute right-1 top-1 border px-1 py-0 text-[10px] uppercase tracking-[0.12em]"
          style={{
            borderColor: "var(--ui-border)",
            backgroundColor: "var(--ui-surface)",
            color: "var(--ui-text)"
          }}
          onClick={onRemove}
        >
          <Icon name="close" size="sm" ariaHidden />
        </button>
      ) : null}
    </div>
  )
}
