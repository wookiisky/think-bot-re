import type { ChangeEventHandler } from "react"
import { StrictMode, useEffect, useRef, useState } from "react"
import { createRoot } from "react-dom/client"

import { TranslationProvider } from "../lib/i18n"
import { useTranslation } from "../hooks/useTranslation"
import { useOptionsStore } from "../store/options"
import { NavigationMenu } from "./components/NavigationMenu"
import { useOptionsNavigation } from "./hooks/useOptionsNavigation"
import { BlacklistPage } from "./pages/BlacklistPage"
import { GeneralPage } from "./pages/GeneralPage"
import { ModelsPage } from "./pages/ModelsPage"
import { ShortcutsPage } from "./pages/ShortcutsPage"
import { SyncPage } from "./pages/SyncPage"
import { downloadConfigFile, parseConfigFile } from "./utils/configFile"

const OptionsApp = () => {
  const { language, t } = useTranslation()
  const { active, handleSelect } = useOptionsNavigation()
  const [importNotice, setImportNotice] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { config, isLoading, isSaving, isDirty, error, load, save, reset, applyConfig, setError } =
    useOptionsStore()

  useEffect(() => {
    void load()
  }, [load])

  const renderActivePage = () => {
    switch (active) {
      case "general":
        return <GeneralPage />
      case "models":
        return <ModelsPage />
      case "shortcuts":
        return <ShortcutsPage />
      case "blacklist":
        return <BlacklistPage />
      case "sync":
        return <SyncPage />
      default:
        return null
    }
  }

  const handleTriggerImport = () => {
    setImportNotice(null)
    fileInputRef.current?.click()
  }

  const handleImportFile: ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsImporting(true)
    setError(undefined)

    try {
      const nextConfig = await parseConfigFile(file)
      applyConfig(nextConfig)
      setImportNotice(`Loaded ${file.name}. Remember to save.`)
    } catch (importError) {
      console.error("[options] import failed", importError)
      setImportNotice(null)
      setError((importError as Error).message)
    } finally {
      setIsImporting(false)
      event.target.value = ""
    }
  }

  const handleExportConfig = () => {
    downloadConfigFile(config)
    setImportNotice("Exported current configuration")
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Think Bot Settings</h1>
          <p className="text-xs text-slate-500">{`${t("app.title")} • ${language}`}</p>
          {isDirty ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Unsaved changes
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            accept="application/json"
            onChange={handleImportFile}
          />
          <button
            className="px-3 py-1 border rounded"
            disabled={isImporting || isLoading}
            onClick={handleTriggerImport}
            type="button"
          >
            {isImporting ? "Importing…" : "Import JSON"}
          </button>
          <button
            className="px-3 py-1 border rounded"
            disabled={isLoading}
            onClick={handleExportConfig}
            type="button"
          >
            Export JSON
          </button>
          <button
            className="px-3 py-1 border rounded"
            disabled={isLoading}
            onClick={() => load()}
            type="button"
          >
            Refresh
          </button>
          <button
            className="px-3 py-1 border rounded"
            disabled={isSaving}
            onClick={() => reset()}
            type="button"
          >
            Reset Defaults
          </button>
          <button
            className="px-4 py-1 rounded bg-black text-white disabled:bg-gray-500"
            disabled={isSaving || !isDirty}
            onClick={() => save()}
            type="button"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>
      {error ? (
        <div className="bg-red-50 text-red-800 px-6 py-3 text-sm">{error}</div>
      ) : null}
      {importNotice ? (
        <div className="bg-emerald-50 text-emerald-700 px-6 py-3 text-sm">{importNotice}</div>
      ) : null}
      <main className="px-6 py-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside>
          <NavigationMenu active={active} onSelect={handleSelect} />
          <div className="text-xs text-slate-500 mt-4">
            <p>Language: {config.general.language}</p>
            <p>Theme: {config.general.theme}</p>
          </div>
        </aside>
        <section>
          {isLoading ? (
            <div className="text-sm text-slate-500">Loading configuration…</div>
          ) : (
            renderActivePage()
          )}
        </section>
      </main>
    </div>
  )
}

const mountOptions = () => {
  const rootElement = document.getElementById("root")

  if (!rootElement) {
    throw new Error("options root element missing")
  }

  const root = createRoot(rootElement)

  root.render(
    <StrictMode>
      <TranslationProvider language="en">
        <OptionsApp />
      </TranslationProvider>
    </StrictMode>
  )
}

  mountOptions()
