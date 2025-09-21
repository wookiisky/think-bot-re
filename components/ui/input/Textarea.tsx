import { forwardRef, useEffect, useId, useRef, useState } from "react"
import type { ChangeEvent, TextareaHTMLAttributes } from "react"

import { cn } from "../support/cn"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
  showCounter?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      showCounter = false,
      id,
      className,
      maxLength,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaId = id ?? useId()
    const initialContent = typeof value === "string" ? value : typeof defaultValue === "string" ? defaultValue : ""
    const [charCount, setCharCount] = useState(initialContent.length)

    useEffect(() => {
      if (typeof value === "string") {
        setCharCount(value.length)
      }
    }, [value])

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(event.target.value.length)
      onChange?.(event)
    }

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {label ? (
          <label
            htmlFor={textareaId}
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: "var(--ui-text-muted)" }}
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          className="min-h-[96px] resize-y border px-3 py-3 text-sm outline-none"
          style={{
            backgroundColor: "var(--ui-surface)",
            borderColor: error ? "var(--ui-danger)" : "var(--ui-border)",
            color: "var(--ui-text)",
            fontFamily: "var(--ui-font-base)"
          }}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
        />
        <div className="flex items-center justify-between text-xs">
          {error ? (
          <span style={{ color: "var(--ui-danger)" }}>{error}</span>
          ) : helperText ? (
            <span style={{ color: "var(--ui-text-muted)" }}>{helperText}</span>
          ) : (
            <span />
          )}
          {showCounter && maxLength ? (
            <span style={{ color: "var(--ui-text-muted)" }}>
              {charCount}/{maxLength}
            </span>
          ) : null}
        </div>
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

interface AutoResizeTextareaProps extends TextareaProps {
  minRows?: number
  maxRows?: number
}

export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ minRows = 3, maxRows = 10, onChange, ...props }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null)

    const assignRef = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ;(ref as { current: HTMLTextAreaElement | null }).current = node
      }
    }

    const resize = () => {
      const node = innerRef.current
      if (!node) {
        return
      }
      node.rows = minRows
      const computed = window.getComputedStyle(node)
      const lineHeight = parseInt(computed.lineHeight, 10)
      const maxHeight = lineHeight * maxRows
      node.style.height = "auto"
      const newHeight = Math.min(node.scrollHeight, maxHeight)
      node.style.height = `${newHeight}px`
    }

    useEffect(() => {
      resize()
    }, [props.value])

    return (
      <Textarea
        {...props}
        ref={assignRef}
        onChange={(event) => {
          resize()
          onChange?.(event)
        }}
      />
    )
  }
)

AutoResizeTextarea.displayName = "AutoResizeTextarea"

interface FloatingLabelTextareaProps extends TextareaProps {
  minRows?: number
}

export const FloatingLabelTextarea = forwardRef<HTMLTextAreaElement, FloatingLabelTextareaProps>(
  (
    {
      label,
      helperText,
      error,
      showCounter = false,
      maxLength,
      className,
      value,
      defaultValue,
      onChange,
      id,
      minRows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId = id ?? useId()
    const initialContent =
      typeof value === "string"
        ? value
        : typeof defaultValue === "string"
          ? defaultValue
          : ""

    const [charCount, setCharCount] = useState(initialContent.length)
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
      if (typeof value === "string") {
        setCharCount(value.length)
      }
    }, [value])

    const hasValue =
      typeof value === "string"
        ? value.length > 0
        : charCount > 0

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div
          className="relative border"
          style={{
            borderColor: error ? "var(--ui-danger)" : "var(--ui-border)",
            backgroundColor: "var(--ui-surface)"
          }}
        >
          <textarea
            ref={ref}
            id={textareaId}
            rows={minRows}
            placeholder=" "
            className="peer w-full min-h-[96px] resize-y bg-transparent px-3 pb-3 pt-5 text-sm outline-none"
            style={{
              color: "var(--ui-text)",
              fontFamily: "var(--ui-font-base)"
            }}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={(event) => {
              setCharCount(event.target.value.length)
              onChange?.(event)
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {label ? (
            <label
              htmlFor={textareaId}
              className={cn(
                "pointer-events-none absolute left-3 select-none uppercase tracking-[0.12em] text-xs transition-all",
                isFocused || hasValue ? "top-2 text-[10px]" : "top-1/2 -translate-y-1/2 text-[11px]"
              )}
              style={{
                color: error ? "var(--ui-danger)" : "var(--ui-text-muted)"
              }}
            >
              {label}
            </label>
          ) : null}
        </div>
        <div className="flex items-center justify-between text-xs">
          {error ? (
            <span style={{ color: "var(--ui-danger)" }}>{error}</span>
          ) : helperText ? (
            <span style={{ color: "var(--ui-text-muted)" }}>{helperText}</span>
          ) : (
            <span />
          )}
          {showCounter && maxLength ? (
            <span style={{ color: "var(--ui-text-muted)" }}>
              {charCount}/{maxLength}
            </span>
          ) : null}
        </div>
      </div>
    )
  }
)

FloatingLabelTextarea.displayName = "FloatingLabelTextarea"

