interface NavigationMenuProps {
  active: string
  onSelect: (next: string) => void
}

const items = [
  { id: "general", label: "General" },
  { id: "models", label: "Models" },
  { id: "shortcuts", label: "Shortcuts" },
  { id: "blacklist", label: "Blacklist" },
  { id: "sync", label: "Sync" }
]

export const NavigationMenu = ({ active, onSelect }: NavigationMenuProps) => {
  return (
    <nav className="space-y-1" aria-label="Settings sections">
      {items.map((item) => {
        const isActive = active === item.id

        return (
          <button
            key={item.id}
            className={`w-full rounded border px-3 py-2 text-left text-sm transition hover:border-slate-400 ${
              isActive
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            onClick={() => onSelect(item.id)}
            type="button"
          >
            <span className="flex items-center justify-between gap-2">
              <span>{item.label}</span>
              {isActive ? (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  Active
                </span>
              ) : null}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
