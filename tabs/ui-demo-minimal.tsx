import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { TranslationProvider } from "../lib/i18n"

const MinimalDemo = () => {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Minimal UI Demo</h1>
      <p>If you can see this, the basic React setup is working.</p>
    </div>
  )
}

const mountTab = () => {
  console.log("Minimal demo mount")
  const rootElement = document.createElement("div")
  document.body.appendChild(rootElement)
  const root = createRoot(rootElement)

  root.render(
    <StrictMode>
      <TranslationProvider language="en">
        <MinimalDemo />
      </TranslationProvider>
    </StrictMode>
  )
}

mountTab()
