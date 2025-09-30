import { ChangeEvent } from "react"

import { PlaceholderCard } from "../../components/PlaceholderCard"
import { useOptionsStore } from "../../store/options"

const themes = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" }
]

const languages = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" }
]

export const GeneralPage = () => {
  const config = useOptionsStore((state) => state.config)
  const update = useOptionsStore((state) => state.update)

  const handleThemeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    update((current) => ({
      ...current,
      general: {
        ...current.general,
        theme: event.target.value as typeof current.general.theme
      }
    }))
  }

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    update((current) => ({
      ...current,
      general: {
        ...current.general,
        language: event.target.value as typeof current.general.language
      }
    }))
  }

  const handleDefaultModelChange = (event: ChangeEvent<HTMLSelectElement>) => {
    update((current) => ({
      ...current,
      general: {
        ...current.general,
        defaultModelId: event.target.value
      }
    }))
  }

  const toggleAttachContent = () => {
    update((current) => ({
      ...current,
      general: {
        ...current.general,
        attachPageContent: !current.general.attachPageContent
      }
    }))
  }

  const handleSidebarHeight = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(event.target.value, 10)

    update((current) => ({
      ...current,
      general: {
        ...current.general,
        sidebarHeight: Number.isNaN(value)
          ? current.general.sidebarHeight
          : value
      }
    }))
  }

  const handleSystemPrompt = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value

    update((current) => ({
      ...current,
      general: {
        ...current.general,
        systemPrompt: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      <PlaceholderCard title="Appearance">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm gap-1">
            <span className="font-medium">Theme</span>
            <select
              className="border rounded px-2 py-1"
              onChange={handleThemeChange}
              value={config.general.theme}
            >
              {themes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm gap-1">
            <span className="font-medium">Language</span>
            <select
              className="border rounded px-2 py-1"
              onChange={handleLanguageChange}
              value={config.general.language}
            >
              {languages.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </PlaceholderCard>

      <PlaceholderCard title="Default behaviour">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col text-sm gap-1">
            <span className="font-medium">Default model</span>
            <select
              className="border rounded px-2 py-1"
              onChange={handleDefaultModelChange}
              value={config.general.defaultModelId}
            >
              {config.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-500">
              Choose which configured model powers the chat input by default.
            </span>
          </label>
          <label className="flex flex-col text-sm gap-1">
            <span className="font-medium">Sidebar initial height (px)</span>
            <input
              className="border rounded px-2 py-1"
              min={240}
              max={960}
              onChange={handleSidebarHeight}
              type="number"
              value={config.general.sidebarHeight}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm mt-4">
          <input
            checked={config.general.attachPageContent}
            onChange={toggleAttachContent}
            type="checkbox"
          />
          Attach extracted page content to prompts by default
        </label>
      </PlaceholderCard>

      <PlaceholderCard title="System prompt">
        <p className="text-xs text-slate-500 mb-2">
          Provide global instructions that will be sent with every request.
        </p>
        <textarea
          className="w-full border rounded px-2 py-2 text-sm min-h-[120px]"
          onChange={handleSystemPrompt}
          placeholder="You are Think Bot, a helpful assistant…"
          value={config.general.systemPrompt}
        />
      </PlaceholderCard>
    </div>
  )
}
