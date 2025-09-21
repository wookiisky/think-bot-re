import { Icon } from "../display/Icon"
import { cn } from "../support/cn"

interface ButtonSelectOption {
  id: string
  label: string
  icon?: string
  tooltip?: string
}

interface ButtonSelectProps {
  options: ButtonSelectOption[]
  selectedId?: string
  onSelect: (id: string) => void
  allowDeselect?: boolean
}

export const ButtonSelect = ({
  options,
  selectedId,
  onSelect,
  allowDeselect = false
}: ButtonSelectProps) => {
  return (
    <div className="flex items-center gap-2">
      {options.map((option) => {
        const isActive = option.id === selectedId
        return (
          <button
            key={option.id}
            type="button"
            title={option.tooltip ?? option.label}
            className={cn(
              "flex h-10 w-10 items-center justify-center border text-xs uppercase tracking-[0.12em]",
              isActive ? "bg-[#0b63ff] text-white" : "bg-transparent text-[var(--ui-text)]"
            )}
            style={{
              borderColor: isActive ? "#0b63ff" : "var(--ui-border)"
            }}
            onClick={() => {
              if (allowDeselect && isActive) {
                onSelect("")
                return
              }
              onSelect(option.id)
            }}
          >
            {option.icon ? <Icon name={option.icon} ariaHidden /> : option.label}
          </button>
        )
      })}
    </div>
  )
}
