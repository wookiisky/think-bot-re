import { forwardRef, useEffect, useId, useState } from "react"
import type { ChangeEvent, SelectHTMLAttributes } from "react"

import { cn } from "../support/cn"

interface OptionItem {
  label: string
  value: string
  description?: string
  disabled?: boolean
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple"> {
  label?: string
  helperText?: string
  error?: string
  options: OptionItem[]
  onValueChange?: (value: string) => void
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, options, id, className, onValueChange, onChange, defaultValue, value, ...props }, ref) => {
    const selectId = id ?? useId()

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
      onValueChange?.(event.target.value)
      onChange?.(event)
    }

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {label ? (
          <label htmlFor={selectId} className="text-xs uppercase tracking-[0.1em]" style={{ color: "var(--ui-text-muted)" }}>
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          className="border px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--ui-surface)",
            borderColor: error ? "#b42318" : "var(--ui-border)",
            color: "var(--ui-text)",
            fontFamily: "var(--ui-font-base)"
          }}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <span className="text-xs" style={{ color: "#b42318" }}>{error}</span>
        ) : helperText ? (
          <span className="text-xs" style={{ color: "var(--ui-text-muted)" }}>{helperText}</span>
        ) : null}
      </div>
    )
  }
)

Select.displayName = "Select"

interface MultiSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple"> {
  label?: string
  helperText?: string
  error?: string
  options: OptionItem[]
  values: string[]
  onValuesChange?: (values: string[]) => void
}

export const MultiSelect = forwardRef<HTMLSelectElement, MultiSelectProps>(
  ({ label, helperText, error, options, id, className, values, onValuesChange, onChange, ...props }, ref) => {
    const selectId = id ?? useId()

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
      const selected = Array.from(event.target.selectedOptions).map((option) => option.value)
      onValuesChange?.(selected)
      onChange?.(event)
    }

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {label ? (
          <label htmlFor={selectId} className="text-xs uppercase tracking-[0.1em]" style={{ color: "var(--ui-text-muted)" }}>
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          multiple
          className="border px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--ui-surface)",
            borderColor: error ? "#b42318" : "var(--ui-border)",
            color: "var(--ui-text)",
            fontFamily: "var(--ui-font-base)",
            minHeight: "120px"
          }}
          value={values}
          onChange={handleChange}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? (
          <span className="text-xs" style={{ color: "#b42318" }}>{error}</span>
        ) : helperText ? (
          <span className="text-xs" style={{ color: "var(--ui-text-muted)" }}>{helperText}</span>
        ) : null}
      </div>
    )
  }
)

MultiSelect.displayName = "MultiSelect"

type FloatingLabelSelectProps = SelectProps

export const FloatingLabelSelect = forwardRef<HTMLSelectElement, FloatingLabelSelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      className,
      id,
      onValueChange,
      onChange,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const selectId = id ?? useId()
    const [isFocused, setIsFocused] = useState(false)

    const computeHasSelection = () => {
      if (value !== undefined && value !== null && `${value}`.length > 0) {
        return true
      }
      if (defaultValue !== undefined && defaultValue !== null && `${defaultValue}`.length > 0) {
        return true
      }
      return false
    }

    const [hasSelection, setHasSelection] = useState(computeHasSelection())

    useEffect(() => {
      setHasSelection(computeHasSelection())
    }, [value, defaultValue])

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
      onValueChange?.(event.target.value)
      onChange?.(event)
      setHasSelection(event.target.value !== "")
    }

    const controlProps =
      value !== undefined
        ? { value }
        : defaultValue !== undefined
          ? { defaultValue }
          : {}

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div
          className="relative border"
          style={{
            borderColor: error ? "#b42318" : "var(--ui-border)",
            backgroundColor: "var(--ui-surface)"
          }}
        >
          <select
            ref={ref}
            id={selectId}
            className="peer w-full appearance-none bg-transparent px-3 pb-2 pt-5 text-sm outline-none"
            style={{
              color: "var(--ui-text)",
              fontFamily: "var(--ui-font-base)"
            }}
            {...controlProps}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          {label ? (
            <label
              htmlFor={selectId}
              className={cn(
                "pointer-events-none absolute left-3 select-none uppercase tracking-[0.12em] text-xs transition-all",
                isFocused || hasSelection ? "top-2 text-[10px]" : "top-1/2 -translate-y-1/2 text-[11px]"
              )}
              style={{
                color: error ? "#b42318" : "var(--ui-text-muted)"
              }}
            >
              {label}
            </label>
          ) : null}
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "var(--ui-text-muted)" }}
          >
            v
          </span>
        </div>
        {error ? (
          <span className="text-xs" style={{ color: "#b42318" }}>
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

FloatingLabelSelect.displayName = "FloatingLabelSelect"

interface FloatingLabelMultiSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "value" | "defaultValue"> {
  label?: string
  helperText?: string
  error?: string
  options: OptionItem[]
  values?: string[]
  defaultValues?: string[]
  value?: string[]
  defaultValue?: string[]
  onValuesChange?: (values: string[]) => void
}

export const FloatingLabelMultiSelect = forwardRef<HTMLSelectElement, FloatingLabelMultiSelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      className,
      id,
      values,
      defaultValues,
      value,
      defaultValue,
      onValuesChange,
      onChange,
      ...props
    },
    ref
  ) => {
    const selectId = id ?? useId()
    const [isFocused, setIsFocused] = useState(false)

    const resolveLength = () => {
      if (Array.isArray(values)) {
        return values.length
      }
      if (Array.isArray(value)) {
        return value.length
      }
      if (Array.isArray(defaultValues)) {
        return defaultValues.length
      }
      if (Array.isArray(defaultValue)) {
        return defaultValue.length
      }
      return 0
    }

    const [selectedCount, setSelectedCount] = useState(resolveLength())

    useEffect(() => {
      setSelectedCount(resolveLength())
    }, [values, value])

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
      const selected = Array.from(event.target.selectedOptions).map((option) => option.value)
      setSelectedCount(selected.length)
      onValuesChange?.(selected)
      onChange?.(event)
    }

    const controlProps =
      values !== undefined
        ? { value: values }
        : value !== undefined
          ? { value }
          : defaultValues !== undefined
            ? { defaultValue: defaultValues }
            : defaultValue !== undefined
              ? { defaultValue }
              : {}

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div
          className="relative border"
          style={{
            borderColor: error ? "#b42318" : "var(--ui-border)",
            backgroundColor: "var(--ui-surface)"
          }}
        >
          <select
            ref={ref}
            id={selectId}
            multiple
            className="peer h-full min-h-[120px] w-full bg-transparent px-3 pb-3 pt-5 text-sm outline-none"
            style={{
              color: "var(--ui-text)",
              fontFamily: "var(--ui-font-base)"
            }}
            {...controlProps}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          {label ? (
            <label
              htmlFor={selectId}
              className={cn(
                "pointer-events-none absolute left-3 select-none uppercase tracking-[0.12em] text-xs transition-all",
                isFocused || selectedCount > 0 ? "top-2 text-[10px]" : "top-1/2 -translate-y-1/2 text-[11px]"
              )}
              style={{
                color: error ? "#b42318" : "var(--ui-text-muted)"
              }}
            >
              {label}
            </label>
          ) : null}
        </div>
        {error ? (
          <span className="text-xs" style={{ color: "#b42318" }}>
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

FloatingLabelMultiSelect.displayName = "FloatingLabelMultiSelect"


