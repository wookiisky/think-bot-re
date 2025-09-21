import { Icon } from "../display/Icon"
import { cn } from "../support/cn"

interface ButtonSwitchProps {
  checked: boolean
  onToggle: (next: boolean) => void
  iconOn?: string
  iconOff?: string
  label?: string
  tooltipOn?: string
  tooltipOff?: string
  disabled?: boolean
}

export const ButtonSwitch = ({
  checked,
  onToggle,
  iconOn = "toggle_on",
  iconOff = "toggle_off",
  label,
  tooltipOn,
  tooltipOff,
  disabled = false
}: ButtonSwitchProps) => {
  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-10 items-center justify-center border text-xs uppercase tracking-[0.12em]",
        checked ? "bg-[#0b63ff] text-white" : "bg-transparent text-[var(--ui-text)]",
        disabled ? "cursor-not-allowed opacity-60" : "hover:translate-y-[-1px]"
      )}
      style={{
        borderColor: checked ? "#0b63ff" : "var(--ui-border)"
      }}
      onClick={() => onToggle(!checked)}
      title={checked ? tooltipOn ?? label : tooltipOff ?? label}
      disabled={disabled}
    >
      <Icon name={checked ? iconOn : iconOff} ariaHidden />
      <span className="sr-only">{label}</span>
    </button>
  )
}
