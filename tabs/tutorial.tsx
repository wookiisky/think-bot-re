import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { TranslationProvider } from "../lib/i18n"
import { useTranslation } from "../hooks/useTranslation"

const TutorialTab = () => {
  const { t } = useTranslation()

  return <div className="p-4">{t("app.title")} tutorial placeholder</div>
}

const mountTab = () => {
  console.info("[tab][tutorial] mount")
  const rootElement = document.createElement("div")
  document.body.appendChild(rootElement)
  const root = createRoot(rootElement)

  root.render(
    <StrictMode>
      <TranslationProvider language="en">
        <TutorialTab />
      </TranslationProvider>
    </StrictMode>
  )
}

mountTab()
