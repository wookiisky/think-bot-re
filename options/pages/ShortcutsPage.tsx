import { useMemo } from "react"

import { PlaceholderCard } from "../../components/PlaceholderCard"
import { useOptionsStore } from "../../store/options"
import type { Config } from "../../lib/storage/schema"
import { FloatingField } from "../components/FloatingField"
import { DraggableList } from "../components/DraggableList"

const createShortcut = (index: number): Config["shortcuts"][number] => ({
  id: `shortcut-${index}`,
  label: `Shortcut ${index}`,
  prompt: "",
  autoTrigger: false,
  modelIds: []
})

export const ShortcutsPage = () => {
  const config = useOptionsStore((state) => state.config)
  const update = useOptionsStore((state) => state.update)

  const availableModels = useMemo(
    () => config.models.filter((model) => !model.disabled),
    [config.models]
  )

  const handleUpdate = (
    id: string,
    patch: Partial<Config["shortcuts"][number]>
  ) => {
    update((current) => ({
      ...current,
      shortcuts: current.shortcuts.map((shortcut) =>
        shortcut.id === id
          ? {
              ...shortcut,
              ...patch
            }
          : shortcut
      )
    }))
  }

  const handleReorder = (items: Config["shortcuts"]) => {
    update((current) => ({
      ...current,
      shortcuts: items
    }))
  }

  const handleToggleModel = (shortcutId: string, modelId: string) => {
    const shortcut = config.shortcuts.find((item) => item.id === shortcutId)

    if (!shortcut) {
      return
    }

    const exists = shortcut.modelIds.includes(modelId)
    const nextModelIds = exists
      ? shortcut.modelIds.filter((id) => id !== modelId)
      : [...shortcut.modelIds, modelId]

    handleUpdate(shortcutId, { modelIds: nextModelIds })
  }

  const handleAdd = () => {
    update((current) => ({
      ...current,
      shortcuts: [...current.shortcuts, createShortcut(current.shortcuts.length + 1)]
    }))
  }

  const handleRemove = (id: string) => {
    update((current) => ({
      ...current,
      shortcuts: current.shortcuts.filter((shortcut) => shortcut.id !== id)
    }))
  }

  return (
    <div className="space-y-6">
      <PlaceholderCard title="Quick input tabs">
        <p className="text-sm text-slate-600">
          Arrange your quick prompts and choose which models can answer them. Tabs follow this order in the sidebar.
        </p>
      </PlaceholderCard>
      <DraggableList
        className="space-y-4"
        items={config.shortcuts}
        getId={(item) => item.id}
        onReorder={handleReorder}
        renderItem={({ item, id, isDragging, handleProps }) => (
          <section
            className={`rounded-lg border bg-white p-4 shadow-sm transition-shadow ${
              isDragging ? "ring-2 ring-amber-400" : ""
            }`}
            data-drag-id={id}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{item.label}</h2>
                <p className="text-xs text-slate-500">
                  {item.autoTrigger ? "Runs automatically after extraction" : "Manual tab"}
                </p>
              </div>
              <button
                aria-label="Drag to reorder"
                className="h-10 w-10 rounded border border-dashed text-xs text-slate-500"
                data-drag-id={id}
                title="Drag to reorder"
                type="button"
                {...handleProps}
              >
                ↕
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FloatingField id={`${id}-label`} label="Display text" required>
                <input
                  className="peer w-full rounded border px-3 py-2 text-sm"
                  data-filled={Boolean(item.label)}
                  id={`${id}-label`}
                  onChange={(event) => handleUpdate(id, { label: event.target.value })}
                  value={item.label}
                />
              </FloatingField>
              <FloatingField
                id={`${id}-auto`}
                label="Trigger mode"
                description="Automatic prompts run when the sidebar finishes extracting content."
              >
                <select
                  className="peer w-full rounded border px-3 py-2 text-sm"
                  data-filled={true}
                  id={`${id}-auto`}
                  onChange={(event) =>
                    handleUpdate(id, { autoTrigger: event.target.value === "auto" })
                  }
                  value={item.autoTrigger ? "auto" : "manual"}
                >
                  <option value="manual">Manual</option>
                  <option value="auto">Auto run after extraction</option>
                </select>
              </FloatingField>
            </div>
            <FloatingField id={`${id}-prompt`} label="Prompt" required>
              <textarea
                className="peer mt-3 w-full rounded border px-3 py-2 text-sm"
                data-filled={Boolean(item.prompt)}
                id={`${id}-prompt`}
                minLength={1}
                onChange={(event) => handleUpdate(id, { prompt: event.target.value })}
                placeholder="Describe what the assistant should do when this tab is used."
                rows={4}
                value={item.prompt}
              />
            </FloatingField>
            <div className="mt-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Allowed models
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableModels.map((model) => {
                  const selected = item.modelIds.includes(model.id)
                  return (
                    <button
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        selected
                          ? "border-sky-500 bg-sky-500/10 text-sky-700"
                          : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                      }`}
                      data-drag-id={id}
                      key={model.id}
                      onClick={() => handleToggleModel(id, model.id)}
                      type="button"
                    >
                      {model.label}
                    </button>
                  )
                })}
                {availableModels.length === 0 ? (
                  <span className="text-xs text-slate-400">Enable at least one model first.</span>
                ) : null}
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
              <span>ID: {item.id}</span>
              <button
                className="text-red-600 hover:underline disabled:opacity-50"
                disabled={config.shortcuts.length <= 1}
                onClick={() => handleRemove(id)}
                type="button"
              >
                Remove shortcut
              </button>
            </div>
          </section>
        )}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">Tabs auto-triggering: {config.shortcuts.filter((item) => item.autoTrigger).length}</div>
        <button className="rounded border px-3 py-1 text-sm" onClick={handleAdd} type="button">
          Add shortcut
        </button>
      </div>
    </div>
  )
}
