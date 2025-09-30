import { PlaceholderCard } from "../../components/PlaceholderCard"
import { useOptionsStore } from "../../store/options"

export const BlacklistPage = () => {
  const config = useOptionsStore((state) => state.config)
  const update = useOptionsStore((state) => state.update)

  const handlePatternChange = (index: number, value: string) => {
    update((current) => ({
      ...current,
      blacklist: current.blacklist.map((pattern, idx) =>
        idx === index ? value : pattern
      )
    }))
  }

  const addPattern = () => {
    update((current) => ({
      ...current,
      blacklist: [...current.blacklist, "https://example.com/*"]
    }))
  }

  const removePattern = (index: number) => {
    update((current) => ({
      ...current,
      blacklist: current.blacklist.filter((_, idx) => idx !== index)
    }))
  }

  const resetPatterns = () => {
    update((current) => ({
      ...current,
      blacklist: ["https://mail.google.com/*", "https://docs.google.com/*"]
    }))
  }

  return (
    <PlaceholderCard title="Blocked websites">
      <p className="text-xs text-slate-500 mb-3">
        Tabs matching any of the following URL patterns will not auto-run the
        sidebar. You can still launch it manually if needed.
      </p>
      <div className="space-y-2">
        {config.blacklist.map((pattern, index) => (
          <div className="flex gap-2" key={pattern + index}>
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              onChange={(event) => handlePatternChange(index, event.target.value)}
              value={pattern}
            />
            <button
              className="text-sm text-red-600"
              onClick={() => removePattern(index)}
              type="button"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <button className="px-3 py-1 border rounded text-sm" onClick={addPattern} type="button">
          Add pattern
        </button>
        <button className="px-3 py-1 border rounded text-sm" onClick={resetPatterns} type="button">
          Reset defaults
        </button>
      </div>
    </PlaceholderCard>
  )
}
