import type { PropsWithChildren, ReactNode } from "react"

interface FloatingFieldProps {
  id: string
  label: ReactNode
  description?: ReactNode
  error?: ReactNode
  required?: boolean
}

export const FloatingField = ({
  id,
  label,
  description,
  error,
  required,
  children
}: PropsWithChildren<FloatingFieldProps>) => {
  return (
    <label className="relative block" htmlFor={id}>
      <span className="pointer-events-none absolute left-3 top-2 text-xs font-medium uppercase tracking-wide text-slate-500 transition-all peer-focus:-translate-y-3 peer-focus:scale-90 peer-focus:text-slate-900 peer-data-[filled=true]:-translate-y-3 peer-data-[filled=true]:scale-90 peer-data-[filled=true]:text-slate-900">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      <div className="flex flex-col gap-1">
        {children}
        {description ? (
          <p className="text-xs text-slate-500">{description}</p>
        ) : null}
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>
    </label>
  )
}
