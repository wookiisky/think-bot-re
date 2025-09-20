import { useEffect } from "react"
import { createRoot } from "react-dom/client"

import { TranslationProvider } from "../../lib/i18n"
import { useTranslation } from "../../hooks/useTranslation"
import { useSidebarStore } from "../../store/sidebar"
import { SidebarContainer } from "./components/SidebarContainer"

const SidebarApp = () => {
  const setReady = useSidebarStore((state) => state.setReady)
  const { language, t } = useTranslation()

  useEffect(() => {
    setReady(true)
    console.info("[sidebar] ready")
  }, [setReady])

  return (
    <SidebarContainer>
      <div className="p-4 text-sm">{`${t("app.title")} (${language})`}</div>
    </SidebarContainer>
  )
}

const mountSidebar = () => {
  console.info("[sidebar] mount container")

  const containerId = "thinkbot-sidebar-root"
  const existing = document.getElementById(containerId)

  if (existing) {
    return
  }

  const container = document.createElement("div")
  container.id = containerId
  document.body.appendChild(container)

  const root = createRoot(container)

  root.render(
    <TranslationProvider language="en">
      <SidebarApp />
    </TranslationProvider>
  )
}

mountSidebar()
