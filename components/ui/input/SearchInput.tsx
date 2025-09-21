import { forwardRef, useId } from "react"
import type { InputHTMLAttributes } from "react"

import { Icon } from "../display/Icon"
import { cn } from "../support/cn"

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string
  helperText?: string
  shortcutHint?: string
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ label, helperText, shortcutHint, onClear, id, className, value, onChange, ...props }, ref) => {
    const inputId = id ?? useId()
    const hasValue = typeof value === "string" ? value.length > 0 : false

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {label ? (
          <label htmlFor={inputId} className="text-xs uppercase tracking-[0.1em]" style={{ color: "var(--ui-text-muted)" }}>
            {label}
          </label>
        ) : null}
        <div
          className="flex items-center gap-2 border px-3 py-2"
          style={{
            backgroundColor: "var(--ui-surface)",
            borderColor: "var(--ui-border)"
          }}
        >
          <Icon name="search" size="sm" ariaHidden />
          <input
            ref={ref}
            id={inputId}
            type="search"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--ui-text)", fontFamily: "var(--ui-font-base)" }}
            value={value}
            onChange={onChange}
            {...props}
          />
          {shortcutHint ? (
            <span className="rounded-none border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]" style={{ borderColor: "var(--ui-border)", color: "var(--ui-text-muted)" }}>
              {shortcutHint}
            </span>
          ) : null}
          {hasValue ? (
            <button
              type="button"
              className="text-xs uppercase tracking-[0.12em]"
              style={{ color: "var(--ui-text-muted)" }}
              onClick={onClear}
            >
              Clear
            </button>
          ) : null}
        </div>
        {helperText ? (
          <span className="text-xs" style={{ color: "var(--ui-text-muted)" }}>
            {helperText}
          </span>
        ) : null}
      </div>
    )
  }
)

SearchInput.displayName = "SearchInput"
