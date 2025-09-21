import { useMemo, useState } from "react"
import type { ReactNode } from "react"

import { Icon } from "./Icon"
import { cn } from "../support/cn"
import { readableTextColor, withAlpha } from "../support/color"
import { useTheme } from "../support/ThemeProvider"

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
  const theme = useTheme()
  const backgroundTint = withAlpha(theme.colors.text, 0.08)
  const overlayBackground = withAlpha(theme.colors.text, 0.78)
  const overlayColor = useMemo(
    () => readableTextColor(overlayBackground, theme.colors.text, theme.colors.surface),
    [overlayBackground, theme.colors.surface, theme.colors.text]
  )

  return (
    <div
      className={cn("relative border", className)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderColor: theme.colors.border,
        backgroundColor: backgroundTint
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
            borderColor: theme.colors.border,
            backgroundColor: overlayBackground,
            color: overlayColor
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
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            color: theme.colors.text
          }}
          onClick={onRemove}
        >
          <Icon name="close" size="sm" ariaHidden />
        </button>
      ) : null}
    </div>
  )
}
