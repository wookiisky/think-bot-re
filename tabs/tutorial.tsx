import { StrictMode, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"

import { TranslationProvider } from "../lib/i18n"
import { useTranslation } from "../hooks/useTranslation"

const steps = [
  {
    title: "Pin the extension",
    description: "Use the browser toolbar to pin Think Bot so it is always one click away."
  },
  {
    title: "Extract page content",
    description: "Open the sidebar and choose a mode. Readability works offline while Jina AI provides AI-enhanced summaries."
  },
  {
    title: "Chat with shortcuts",
    description: "Switch between quick prompts or stay in the Chat tab to ask free-form questions."
  },
  {
    title: "Review history",
    description: "Open the conversations page to revisit earlier answers and export transcripts."
  }
]

const TutorialTab = () => {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const activeStep = steps[activeIndex]
  const percentComplete = useMemo(
    () => Math.round(((activeIndex + 1) / steps.length) * 100),
    [activeIndex]
  )

  const handleNext = () => {
    setActiveIndex((current) => Math.min(current + 1, steps.length - 1))
  }

  const handlePrevious = () => {
    setActiveIndex((current) => Math.max(current - 1, 0))
  }

  const handleOpenSidebar = () => {
    try {
      chrome.runtime.sendMessage({ type: "sidebar:focus" }, () => {
        if (chrome.runtime.lastError) {
          window.open(chrome.runtime.getURL("tabs/conversations.html"), "_blank")
        }
      })
    } catch (error) {
      window.open(chrome.runtime.getURL("tabs/conversations.html"), "_blank")
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-10 text-slate-900">
      <header className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">{t("app.title")}</h1>
        <p className="text-sm text-slate-500">
          Welcome! Follow this short walkthrough to learn the essential features before chatting with any webpage.
        </p>
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-sky-500 transition-all"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <div className="mt-2 text-xs font-medium text-slate-600">
            Step {activeIndex + 1} of {steps.length}
          </div>
        </div>
      </header>
      <section className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white border rounded p-6 shadow-sm">
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-semibold text-slate-400">{activeIndex + 1}.</span>
            <div>
              <h2 className="text-lg font-semibold">{activeStep.title}</h2>
              <p className="text-sm text-slate-600">{activeStep.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button
            className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 disabled:opacity-50"
            disabled={activeIndex === 0}
            onClick={handlePrevious}
            type="button"
          >
            Previous
          </button>
          <div className="flex gap-2">
            <button
              className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700"
              onClick={handleOpenSidebar}
              type="button"
            >
              Open sidebar
            </button>
            <button
              className="rounded bg-slate-900 px-3 py-1 text-sm font-medium text-white disabled:opacity-50"
              disabled={activeIndex === steps.length - 1}
              onClick={handleNext}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

const mountTab = () => {
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
