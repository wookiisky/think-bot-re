import {
  StrictMode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import type {
  ClipboardEvent as ReactClipboardEvent,
  PointerEvent as ReactPointerEvent
} from "react"
import ReactMarkdown from "react-markdown"
import { createRoot } from "react-dom/client"

import { TranslationProvider } from "../../lib/i18n"
import { useTranslation } from "../../hooks/useTranslation"
import {
  useSidebarStore,
  type SidebarAttachment
} from "../../store/sidebar"
import { SidebarContainer } from "./components/SidebarContainer"
import { sendBackgroundMessage } from "../../lib/messaging/client"
import type { ConversationMessage } from "../../lib/conversation/schema"

interface ConversationTurn {
  id: string
  user?: ConversationMessage
  branches: ConversationMessage[]
}

const groupMessagesIntoTurns = (messages: ConversationMessage[]): ConversationTurn[] => {
  const turns: ConversationTurn[] = []
  let current: ConversationTurn | null = null

  messages.forEach((message) => {
    if (message.role === "user") {
      if (current) {
        turns.push(current)
      }

      current = {
        id: message.id,
        user: message,
        branches: []
      }
    } else {
      if (!current) {
        current = {
          id: message.id,
          branches: [message]
        }
        return
      }

      current.branches = [...current.branches, message]
    }
  })

  if (current) {
    turns.push(current)
  }

  return turns
}

const createAttachmentId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `att-${Math.random().toString(36).slice(2, 10)}`

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const SidebarApp = () => {
  const { t } = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const dragState = useRef<{ startY: number; startHeight: number } | null>(null)
  const [resizeActive, setResizeActive] = useState(false)
  const {
    ready,
    error,
    config,
    extraction,
    extractionHeight,
    messages,
    selectedShortcutId,
    input,
    attachContent,
    attachments,
    isSending,
    conversation,
    load,
    triggerExtraction,
    sendMessage,
    clearConversation,
    setInput,
    setSelectedShortcut,
    toggleAttachContent,
    addAttachment,
    removeAttachment,
    setExtractionHeight
  } = useSidebarStore()

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (ready && extraction.status === "idle") {
      void triggerExtraction(config.extraction.defaultMode)
    }
  }, [ready, extraction.status, triggerExtraction, config.extraction.defaultMode])

  const turns = useMemo(() => groupMessagesIntoTurns(messages), [messages])

  const handleModeSwitch = (mode: "readability" | "jina") => {
    void triggerExtraction(mode)
  }

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(extraction.content)
    } catch (copyError) {
      console.warn("[sidebar] copy failed", copyError)
    }
  }

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    }
  }

  const openConversations = () => {
    window.open(chrome.runtime.getURL("tabs/conversations.html"), "_blank")
  }

  const handleResizeStart = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    dragState.current = {
      startY: event.clientY,
      startHeight: extractionHeight
    }
    setResizeActive(true)

    const handleMove = (moveEvent: PointerEvent) => {
      if (!dragState.current) {
        return
      }

      const delta = moveEvent.clientY - dragState.current.startY
      setExtractionHeight(dragState.current.startHeight + delta)
    }

    const handleEnd = () => {
      dragState.current = null
      setResizeActive(false)
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleEnd)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleEnd)
  }, [extractionHeight, setExtractionHeight])

  const handlePaste = async (event: ReactClipboardEvent<HTMLTextAreaElement>) => {
    if (!event.clipboardData) {
      return
    }

    const files: File[] = []

    for (const item of event.clipboardData.items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile()

        if (file) {
          files.push(file)
        }
      }
    }

    if (files.length === 0) {
      return
    }

    event.preventDefault()

    for (const file of files) {
      try {
        const dataUrl = await toDataUrl(file)
        addAttachment({
          id: createAttachmentId(),
          type: "image",
          mimeType: file.type,
          dataUrl
        })
      } catch (attachmentError) {
        console.warn("[sidebar] failed to capture attachment", attachmentError)
      }
    }
  }

  const handleAttachmentRemove = (attachment: SidebarAttachment) => {
    removeAttachment(attachment.id)
  }

  const handleRetry = (message: ConversationMessage) => {
    setInput(message.content)
    textareaRef.current?.focus()
  }

  const handleCopyText = async (message: ConversationMessage) => {
    try {
      await navigator.clipboard.writeText(message.content)
    } catch (copyError) {
      console.warn("[sidebar] copy message failed", copyError)
    }
  }

  const handleExport = async () => {
    if (!conversation) {
      return
    }

    try {
      const response = await sendBackgroundMessage({
        type: "conversation:export",
        payload: { conversationId: conversation.id }
      })

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to export conversation")
      }

      const blob = new Blob([response.data.content], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = response.data.fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (exportError) {
      console.error("[sidebar] export failed", exportError)
    }
  }

  const quickTabs = useMemo(() => {
    const tabs = [
      { id: "chat", label: "Chat", autoTrigger: false },
      ...config.shortcuts
    ]

    const seenIds = new Set<string>()

    return tabs.filter((tab) => {
      if (seenIds.has(tab.id)) {
        return false
      }

      seenIds.add(tab.id)
      return true
    })
  }, [config.shortcuts])

  return (
    <SidebarContainer>
      <div className="flex h-full flex-col text-sm text-slate-900">
        <header className="border-b bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{t("app.title")}</h2>
              <p className="text-xs text-slate-500">
                {extraction.status === "loading" ? "Extracting page…" : "Conversation ready"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-100"
                onClick={openConversations}
                type="button"
              >
                History
              </button>
              <button
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-100"
                onClick={openOptions}
                type="button"
              >
                Options
              </button>
            </div>
          </div>
          {error ? <div className="mt-2 text-xs text-red-600">{error}</div> : null}
        </header>
        <section className="border-b bg-slate-50">
          <div className="flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-wide text-slate-500">
            <span>Extraction</span>
            <div className="flex gap-1">
              <button
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  extraction.mode === "readability"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700"
                }`}
                onClick={() => handleModeSwitch("readability")}
                type="button"
              >
                Readability
              </button>
              <button
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  extraction.mode === "jina" ? "bg-slate-900 text-white" : "bg-white text-slate-700"
                }`}
                onClick={() => handleModeSwitch("jina")}
                type="button"
              >
                Jina AI
              </button>
            </div>
            <div className="ml-auto flex gap-2">
              <button
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-100"
                onClick={() => handleModeSwitch(extraction.mode)}
                type="button"
              >
                Refresh
              </button>
              <button
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-100"
                onClick={handleCopyContent}
                type="button"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="px-3 pb-3">
            <div
              className="overflow-auto rounded border bg-white p-3 text-xs leading-relaxed"
              style={{ height: `${Math.round(extractionHeight)}px` }}
            >
              {extraction.status === "loading" ? (
                <div className="text-slate-500">Loading page content…</div>
              ) : extraction.status === "error" ? (
                <div className="text-red-600">Unable to extract content.</div>
              ) : (
                <>
                  <h3 className="mb-2 font-semibold">{extraction.title}</h3>
                  <p className="whitespace-pre-wrap">{extraction.content.slice(0, 4000)}</p>
                </>
              )}
            </div>
            <div
              className={`mt-1 h-2 cursor-row-resize rounded-full ${
                resizeActive ? "bg-slate-400" : "bg-transparent"
              }`}
              onPointerDown={handleResizeStart}
            />
          </div>
        </section>
        <nav className="flex gap-1 overflow-x-auto border-b bg-white px-3 py-2">
          {quickTabs.map((shortcut) => {
            const isActive = shortcut.id === selectedShortcutId
            const hasMessages = isActive && messages.length > 0

            return (
              <button
                key={shortcut.id}
                className={`relative rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive ? "bg-slate-900 text-white" : "bg-white text-slate-700"
                }`}
                onClick={() => setSelectedShortcut(shortcut.id)}
                type="button"
              >
                {shortcut.label ?? shortcut.id}
                {hasMessages ? (
                  <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-sky-400" />
                ) : null}
                {"autoTrigger" in shortcut && shortcut.autoTrigger ? (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-500">Auto</span>
                ) : null}
              </button>
            )
          })}
        </nav>
        <section className="flex-1 overflow-auto bg-slate-50">
          <div className="space-y-4 px-3 py-4">
            {turns.map((turn) => (
              <div className="space-y-3" key={turn.id}>
                {turn.user ? (
                  <article className="rounded border border-slate-200 bg-white p-3 shadow-sm">
                    <header className="mb-2 flex items-center justify-between text-xs text-slate-500">
                      <span>You</span>
                      <span>{new Date(turn.user.createdAt).toLocaleTimeString()}</span>
                    </header>
                    <ReactMarkdown className="prose prose-slate max-w-none text-sm">
                      {turn.user.content || "(empty message)"}
                    </ReactMarkdown>
                    <footer className="mt-3 flex justify-end gap-2 text-xs">
                      <button
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-100"
                        onClick={() => handleRetry(turn.user as ConversationMessage)}
                        type="button"
                      >
                        Retry
                      </button>
                      <button
                        className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-100"
                        onClick={() => handleCopyText(turn.user as ConversationMessage)}
                        type="button"
                      >
                        Copy
                      </button>
                    </footer>
                  </article>
                ) : null}
                {turn.branches.length > 0 ? (
                  <div
                    className={`grid gap-3 ${
                      turn.branches.length > 1 ? "md:grid-cols-2" : "grid-cols-1"
                    }`}
                  >
                    {turn.branches.map((branch) => (
                      <article
                        className={`relative rounded border p-3 shadow-sm ${
                          branch.isStreaming
                            ? "border-sky-300 bg-white"
                            : branch.error
                            ? "border-red-200 bg-red-50"
                            : "border-slate-800 bg-slate-900 text-white"
                        }`}
                        key={branch.id}
                      >
                        <header className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide">
                          <span>{branch.modelId ?? "Assistant"}</span>
                          <span>{new Date(branch.createdAt).toLocaleTimeString()}</span>
                        </header>
                        <div className="prose prose-invert max-w-none text-sm">
                          <ReactMarkdown>{branch.content || (branch.isStreaming ? "Generating…" : "")}</ReactMarkdown>
                        </div>
                        {branch.error ? (
                          <pre className="mt-3 overflow-auto rounded bg-red-900/40 p-2 text-[11px]">
                            {branch.error}
                          </pre>
                        ) : null}
                        <footer className="mt-3 flex gap-2 text-xs">
                          <button
                            className="rounded border border-white/40 bg-transparent px-2 py-1 text-xs font-medium hover:bg-white/10"
                            onClick={() => handleCopyText(branch)}
                            type="button"
                          >
                            Copy
                          </button>
                          <button
                            className="rounded border border-white/40 bg-transparent px-2 py-1 text-xs font-medium hover:bg-white/10"
                            onClick={() => handleRetry(turn.user ?? branch)}
                            type="button"
                          >
                            Branch
                          </button>
                        </footer>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {turns.length === 0 ? (
              <div className="rounded border border-dashed border-slate-300 bg-white p-6 text-center text-xs text-slate-500">
                Start a conversation to see responses here.
              </div>
            ) : null}
          </div>
        </section>
        <footer className="border-t bg-white p-3">
          {attachments.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-3">
              {attachments.map((attachment) => (
                <div
                  className="group relative h-16 w-16 overflow-hidden rounded border"
                  key={attachment.id}
                >
                  <img
                    alt="Attachment preview"
                    className="h-full w-full object-cover"
                    src={attachment.dataUrl}
                  />
                  <button
                    className="absolute inset-0 hidden items-center justify-center bg-black/60 text-xs text-white group-hover:flex"
                    onClick={() => handleAttachmentRemove(attachment)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <textarea
            ref={textareaRef}
            className="peer w-full resize-none rounded border px-3 py-2 text-sm"
            data-filled={Boolean(input)}
            onChange={(event) => setInput(event.target.value)}
            onPaste={handlePaste}
            placeholder="Ask a question…"
            rows={3}
            value={input}
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2">
              <input checked={attachContent} onChange={toggleAttachContent} type="checkbox" />
              Attach page content
            </label>
            <div className="flex items-center gap-2">
              <button
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
                disabled={!conversation}
                onClick={handleExport}
                type="button"
              >
                Export
              </button>
              <button
                className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
                disabled={!conversation}
                onClick={() => clearConversation()}
                type="button"
              >
                Clear
              </button>
              <button
                className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:bg-gray-400"
                disabled={isSending}
                onClick={() => sendMessage()}
                type="button"
              >
                {isSending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </SidebarContainer>
  )
}

const mountSidebar = () => {
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
