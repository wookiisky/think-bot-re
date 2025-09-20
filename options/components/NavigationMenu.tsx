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
    <nav className="flex gap-2 mb-4">
      {items.map((item) => (
        <button
          key={item.id}
          className={`px-3 py-1 border ${active === item.id ? "bg-black text-white" : "bg-white"}`}
          onClick={() => onSelect(item.id)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
