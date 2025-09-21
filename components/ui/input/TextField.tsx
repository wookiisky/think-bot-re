import { forwardRef, useId } from "react"
import type { InputHTMLAttributes, ReactNode } from "react"

import { cn } from "../support/cn"

export type TextFieldSize = "sm" | "md" | "lg"

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string
  helperText?: string
  error?: string
  prefix?: ReactNode
  suffix?: ReactNode
  size?: TextFieldSize
}

const sizeClassMap: Record<TextFieldSize, string> = {
  sm: "h-8 text-xs",
  md: "h-10 text-sm",
  lg: "h-12 text-base"
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({
    label,
    helperText,
    error,
    prefix,
    suffix,
    size = "md",
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id ?? useId()

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {label ? (
          <label
            htmlFor={inputId}
            className="text-xs uppercase tracking-[0.1em]"
            style={{ color: "var(--ui-text-muted)" }}
          >
            {label}
          </label>
        ) : null}
        <div
          className="flex items-center gap-2 border px-3"
          style={{
            backgroundColor: "var(--ui-surface)",
            borderColor: error ? "var(--ui-danger)" : "var(--ui-border)"
          }}
        >
          {prefix ? <span className="text-xs" style={{ color: "var(--ui-text-muted)" }}>{prefix}</span> : null}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "flex-1 bg-transparent outline-none",
              sizeClassMap[size]
            )}
            style={{
              color: "var(--ui-text)",
              fontFamily: "var(--ui-font-base)"
            }}
            {...props}
          />
          {suffix ? <span className="text-xs" style={{ color: "var(--ui-text-muted)" }}>{suffix}</span> : null}
        </div>
        {error ? (
          <span className="text-xs" style={{ color: "var(--ui-danger)" }}>
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs" style={{ color: "var(--ui-text-muted)" }}>
            {helperText}
          </span>
        ) : null}
      </div>
    )
  }
)

TextField.displayName = "TextField"

interface FloatingLabelTextFieldProps extends TextFieldProps {
  floatingLabel?: string
}

export const FloatingLabelTextField = forwardRef<HTMLInputElement, FloatingLabelTextFieldProps>(
  ({
    floatingLabel,
    helperText,
    error,
    size = "md",
    className,
    id,
    ...props
  }, ref) => {
    const inputId = id ?? useId()

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div
          className="relative border"
          style={{
            borderColor: error ? "var(--ui-danger)" : "var(--ui-border)",
            backgroundColor: "var(--ui-surface)"
          }}
        >
          <input
            ref={ref}
            id={inputId}
            placeholder=" "
            className={cn(
              "peer w-full bg-transparent px-3", sizeClassMap[size],
              size === "sm" ? "pt-4" : size === "lg" ? "pt-6" : "pt-5"
            )}
            style={{
              color: "var(--ui-text)",
              fontFamily: "var(--ui-font-base)"
            }}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "pointer-events-none absolute left-3 select-none uppercase tracking-[0.12em] text-xs transition-all",
              "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-[11px]",
              "peer-focus:top-2 peer-focus:-translate-y-0 peer-focus:text-[10px]"
            )}
            style={{
              color: error ? "var(--ui-danger)" : "var(--ui-text-muted)"
            }}
          >
            {floatingLabel}
          </label>
        </div>
        {error ? (
          <span className="text-xs" style={{ color: "var(--ui-danger)" }}>
            {error}
          </span>
        ) : helperText ? (
          <span className="text-xs" style={{ color: "var(--ui-text-muted)" }}>
            {helperText}
          </span>
        ) : null}
      </div>
    )
  }
)

FloatingLabelTextField.displayName = "FloatingLabelTextField"
