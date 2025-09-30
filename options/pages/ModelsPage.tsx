import { useMemo } from "react"
import type { ChangeEvent } from "react"

import { PlaceholderCard } from "../../components/PlaceholderCard"
import { useOptionsStore } from "../../store/options"
import type { Config } from "../../lib/storage/schema"
import { FloatingField } from "../components/FloatingField"
import { DraggableList } from "../components/DraggableList"

const providerOptions = [
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "bedrock", label: "AWS Bedrock" }
]

const createModel = (index: number): Config["models"][number] => ({
  id: `custom-${index}`,
  label: `Custom model ${index}`,
  provider: "openai",
  model: "gpt-4o-mini",
  apiKey: "",
  endpoint: undefined,
  deploymentId: undefined,
  supportsImages: false,
  streaming: true,
  disabled: false
})

export const ModelsPage = () => {
  const config = useOptionsStore((state) => state.config)
  const update = useOptionsStore((state) => state.update)

  const activeModels = useMemo(
    () => config.models.filter((model) => !model.disabled),
    [config.models]
  )

  const handleUpdate = (
    id: string,
    patch: Partial<Config["models"][number]>
  ) => {
    update((current) => ({
      ...current,
      models: current.models.map((model) =>
        model.id === id
          ? {
              ...model,
              ...patch
            }
          : model
      )
    }))
  }

  const handleToggle = (
    id: string,
    field: "supportsImages" | "streaming" | "disabled"
  ) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      handleUpdate(id, {
        [field]: event.target.checked
      } as Partial<Config["models"][number]>)
    }

  const handleReorder = (items: Config["models"]) => {
    update((current) => ({
      ...current,
      models: items,
      general: {
        ...current.general,
        defaultModelId:
          items.some(
            (model) =>
              model.id === current.general.defaultModelId && !model.disabled
          )
            ? current.general.defaultModelId
            : items.find((model) => !model.disabled)?.id ??
              current.general.defaultModelId
      }
    }))
  }

  const handleRemove = (id: string) => {
    update((current) => {
      const models = current.models.filter((model) => model.id !== id)
      const defaultModelId = models.some(
        (model) => model.id === current.general.defaultModelId
      )
        ? current.general.defaultModelId
        : models[0]?.id ?? ""

      return {
        ...current,
        models,
        general: {
          ...current.general,
          defaultModelId: defaultModelId || current.general.defaultModelId
        }
      }
    })
  }

  const handleAdd = () => {
    update((current) => ({
      ...current,
      models: [...current.models, createModel(current.models.length + 1)]
    }))
  }

  return (
    <div className="space-y-6">
      <PlaceholderCard title="Language models">
        <p className="text-sm text-slate-600">
          Drag to reorder your providers. The first enabled model becomes the default when a shortcut does not specify one.
        </p>
      </PlaceholderCard>
      <DraggableList
        className="space-y-4"
        items={config.models}
        getId={(item) => item.id}
        onReorder={handleReorder}
        renderItem={({ item, id, isDragging, handleProps }) => (
          <section
            className={`rounded-lg border bg-white p-4 shadow-sm transition-shadow ${
              isDragging ? "ring-2 ring-sky-400" : ""
            }`}
            data-drag-id={id}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{item.label}</h2>
                <p className="text-xs text-slate-500">
                  {item.disabled ? "Disabled" : `Provider: ${item.provider}`}
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
              <FloatingField id={`${id}-label`} label="Display name" required>
                <input
                  className="peer w-full rounded border px-3 py-2 text-sm"
                  data-filled={Boolean(item.label)}
                  id={`${id}-label`}
                  onChange={(event) => handleUpdate(id, { label: event.target.value })}
                  value={item.label}
                />
              </FloatingField>
              <FloatingField id={`${id}-provider`} label="Provider" required>
                <select
                  className="peer w-full rounded border px-3 py-2 text-sm"
                  data-filled={Boolean(item.provider)}
                  id={`${id}-provider`}
                  onChange={(event) => handleUpdate(id, { provider: event.target.value as Config["models"][number]["provider"] })}
                  value={item.provider}
                >
                  {providerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FloatingField>
              <FloatingField id={`${id}-model`} label="Model identifier" required>
                <input
                  className="peer w-full rounded border px-3 py-2 text-sm"
                  data-filled={Boolean(item.model)}
                  id={`${id}-model`}
                  onChange={(event) => handleUpdate(id, { model: event.target.value })}
                  value={item.model}
                />
              </FloatingField>
              <FloatingField
                id={`${id}-apiKey`}
                label="API key"
                description="Keys are stored locally and never synced unless you enable cloud sync."
              >
                <input
                  className="peer w-full rounded border px-3 py-2 text-sm"
                  data-filled={Boolean(item.apiKey)}
                  id={`${id}-apiKey`}
                  onChange={(event) => handleUpdate(id, { apiKey: event.target.value })}
                  type="password"
                  value={item.apiKey ?? ""}
                />
              </FloatingField>
              <FloatingField
                id={`${id}-endpoint`}
                label="Custom endpoint"
                description="Optional override for self-hosted gateways or Azure endpoints."
              >
                <input
                  className="peer w-full rounded border px-3 py-2 text-sm"
                  data-filled={Boolean(item.endpoint)}
                  id={`${id}-endpoint`}
                  onChange={(event) => handleUpdate(id, { endpoint: event.target.value || undefined })}
                  placeholder="https://api.openai.com"
                  value={item.endpoint ?? ""}
                />
              </FloatingField>
              <FloatingField
                id={`${id}-deployment`}
                label="Deployment / region"
                description="Required for Azure OpenAI or Bedrock models."
              >
                <input
                  className="peer w-full rounded border px-3 py-2 text-sm"
                  data-filled={Boolean(item.deploymentId)}
                  id={`${id}-deployment`}
                  onChange={(event) => handleUpdate(id, { deploymentId: event.target.value || undefined })}
                  placeholder="eastus/gpt-4o"
                  value={item.deploymentId ?? ""}
                />
              </FloatingField>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  checked={item.supportsImages}
                  onChange={handleToggle(id, "supportsImages")}
                  type="checkbox"
                />
                Supports images
              </label>
              <label className="flex items-center gap-2">
                <input
                  checked={item.streaming}
                  onChange={handleToggle(id, "streaming")}
                  type="checkbox"
                />
                Streaming enabled
              </label>
              <label className="flex items-center gap-2">
                <input
                  checked={item.disabled}
                  onChange={handleToggle(id, "disabled")}
                  type="checkbox"
                />
                Disabled
              </label>
              <button
                className="ml-auto text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                disabled={config.models.length <= 1}
                onClick={() => handleRemove(id)}
                type="button"
              >
                Remove model
              </button>
            </div>
          </section>
        )}
      />
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Active models: {activeModels.length} / {config.models.length}
        </div>
        <button className="rounded border px-3 py-1 text-sm" onClick={handleAdd} type="button">
          Add model
        </button>
      </div>
    </div>
  )
}
