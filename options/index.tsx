import { StrictMode } from "react"
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

const OptionsApp = () => {
  const { language } = useTranslation()
  const config = useOptionsStore((state) => state.config)
  const { active, handleSelect } = useOptionsNavigation()

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

  console.info("[options] render", { active, language, config })

  return (
    <div className="p-6">
      <NavigationMenu active={active} onSelect={handleSelect} />
      {renderActivePage()}
    </div>
  )
}

const mountOptions = () => {
  console.info("[options] mount")

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
