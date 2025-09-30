import {
  StrictMode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { createRoot } from "react-dom/client"

import type { Conversation } from "../lib/conversation/schema"
import type { ConversationMessage } from "../lib/conversation/schema"
import type { Config, LanguageModel } from "../lib/storage/schema"
import { TranslationProvider } from "../lib/i18n"
import { useTranslation } from "../hooks/useTranslation"
import { sendBackgroundMessage } from "../lib/messaging/client"
import { sortConversations, upsertConversation } from "./conversations-utils"

const ConversationsTab = () => {
  const { t } = useTranslation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState("")
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [config, setConfig] = useState<Config | null>(null)
  const [selectedShortcutId, setSelectedShortcutId] = useState("chat")
  const [composerInput, setComposerInput] = useState("")
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const resizeState = useRef<{ startX: number; startWidth: number } | null>(null)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  type Shortcut = Config["shortcuts"][number]

  const normalizedQuery = searchTerm.trim().toLowerCase()

  const filteredConversations = useMemo(() => {
    if (!normalizedQuery) {
      return conversations
    }
    return conversations.filter((conversation) => {
      const haystack = `${conversation.title} ${conversation.url ?? ""}`
        .trim()
        .toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [conversations, normalizedQuery])

  useEffect(() => {
    const load = async () => {
      try {
        const [conversationResponse, configResponse] = await Promise.all([
          sendBackgroundMessage({
            type: "conversation:list",
            payload: undefined
          }),
          sendBackgroundMessage({
            type: "config:get",
            payload: undefined
          })
        ])

        if (!conversationResponse.success || !conversationResponse.data) {
          throw new Error(conversationResponse.error ?? "Failed to load conversations")
        }

        if (!configResponse.success || !configResponse.data) {
          throw new Error(configResponse.error ?? "Failed to load config")
        }

        const ordered = sortConversations(conversationResponse.data)
        const enabledModels = configResponse.data.models.filter((model) => !model.disabled)
        const defaultModel = enabledModels.find(
          (model) => model.id === configResponse.data.general.defaultModelId
        )
        const initialModelId = defaultModel?.id ?? enabledModels[0]?.id ?? null

        setConversations(ordered)
        setSelectedId(ordered[0]?.id ?? null)
        setConfig(configResponse.data)
        setSelectedShortcutId(configResponse.data.shortcuts[0]?.id ?? "chat")
        setSelectedModelId(initialModelId)
        setError(null)
      } catch (loadError) {
        setError((loadError as Error).message)
      }
    }

    void load()
  }, [])

  const selectedConversation = useMemo(
    () => filteredConversations.find((conversation) => conversation.id === selectedId) ?? null,
    [filteredConversations, selectedId]
  )

  useEffect(() => {
    if (selectedConversation) {
      setTitleDraft(selectedConversation.title)
    } else {
      setTitleDraft("")
    }

    setIsEditingTitle(false)
  }, [selectedConversation])

  useEffect(() => {
    if (selectedId && filteredConversations.some((item) => item.id === selectedId)) {
      return
    }

    const nextSelection = filteredConversations[0]?.id ?? null
    setSelectedId(nextSelection)
  }, [filteredConversations, selectedId])

  useEffect(() => {
    if (!selectedId) {
      setMessages([])
      return
    }

    const loadConversation = async () => {
      const response = await sendBackgroundMessage({
        type: "conversation:get",
        payload: { conversationId: selectedId }
      })

      if (!response.success || !response.data) {
        setError(response.error ?? "Failed to load conversation")
        return
      }

      setMessages(response.data.messages)
      setError(null)
    }

    void loadConversation()
  }, [selectedId])

  const handleConversationUpdate = useCallback((updated: Conversation) => {
    setConversations((previous) => upsertConversation(previous, updated))
  }, [])

  const handleExport = async () => {
    if (!selectedId) {
      return
    }

    setIsExporting(true)

    try {
      const response = await sendBackgroundMessage({
        type: "conversation:export",
        payload: { conversationId: selectedId }
      })

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to export conversation")
      }

      const blob = new Blob([response.data.content], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = response.data.fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setError(null)
    } catch (exportError) {
      setError((exportError as Error).message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleRename = useCallback(
    async (conversation: Conversation, proposedTitle: string) => {
      const trimmedTitle = proposedTitle.trim()

      if (!trimmedTitle || trimmedTitle === conversation.title) {
        setTitleDraft(conversation.title)
        setIsEditingTitle(false)
        return
      }

      setRenamingId(conversation.id)

      try {
        const response = await sendBackgroundMessage({
          type: "conversation:update",
          payload: { conversationId: conversation.id, title: trimmedTitle }
        })

        if (!response.success || !response.data) {
          throw new Error(response.error ?? "Failed to rename conversation")
        }

        const updatedConversation = response.data
        handleConversationUpdate(updatedConversation)
        setTitleDraft(updatedConversation.title)
        setError(null)
      } catch (renameError) {
        setError((renameError as Error).message)
      } finally {
        setRenamingId(null)
        setIsEditingTitle(false)
      }
    },
    [handleConversationUpdate]
  )

  const handleDelete = async (conversation: Conversation) => {
    const confirmed = window.confirm(
      `Delete conversation "${conversation.title}"? This action cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(conversation.id)

    try {
      const response = await sendBackgroundMessage({
        type: "conversation:delete",
        payload: { conversationId: conversation.id }
      })

      if (!response.success) {
        throw new Error(response.error ?? "Failed to delete conversation")
      }

      setConversations((previous) =>
        previous.filter((item) => item.id !== conversation.id)
      )
      setError(null)
    } catch (deleteError) {
      setError((deleteError as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  const beginResize = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    resizeState.current = {
      startX: event.clientX,
      startWidth: sidebarWidth
    }

    const handleMove = (moveEvent: PointerEvent) => {
      if (!resizeState.current) {
        return
      }

      const delta = moveEvent.clientX - resizeState.current.startX
      const nextWidth = Math.min(
        420,
        Math.max(220, resizeState.current.startWidth + delta)
      )
      setSidebarWidth(nextWidth)
    }

    const stop = () => {
      resizeState.current = null
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", stop)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", stop)
  }, [sidebarWidth])

  useEffect(() => {
    if (!isEditingTitle) {
      return
    }

    const input = titleInputRef.current

    if (!input) {
      return
    }

    input.focus()
    input.select()
  }, [isEditingTitle])

  const availableModels = useMemo(() => {
    if (!config) {
      return [] as LanguageModel[]
    }

    return config.models.filter((model) => !model.disabled)
  }, [config])

  const selectedShortcut = useMemo(() => {
    if (!config) {
      return undefined
    }

    return config.shortcuts.find((shortcut) => shortcut.id === selectedShortcutId)
  }, [config, selectedShortcutId])

  const handleSend = useCallback(
    async ({
      overridePrompt,
      shortcut
    }: {
      overridePrompt?: string
      shortcut?: Shortcut
    } = {}) => {
      if (!selectedConversation || !config) {
        return
      }

      const shortcutToUse = shortcut ?? selectedShortcut
      const promptSource = overridePrompt ?? composerInput
      const fallbackPrompt = shortcutToUse?.prompt?.trim() ?? ""
      const prompt = promptSource.trim() || fallbackPrompt

      if (!prompt) {
        return
      }

      const configuredModelIds = shortcutToUse?.modelIds.filter(Boolean) ?? []
      const candidateModelId = selectedModelId ?? config.general.defaultModelId
      const modelIds = configuredModelIds.length
        ? configuredModelIds
        : candidateModelId
          ? [candidateModelId]
          : []

      const primaryModelId = modelIds[0]

      if (!primaryModelId) {
        setError("No model available for sending.")
        return
      }

      setIsSending(true)

      try {
        const response = await sendBackgroundMessage({
          type: "conversation:append",
          payload: {
            conversationId: selectedConversation.id,
            message: prompt,
            modelId: primaryModelId,
            modelIds,
            shortcutId: shortcutToUse?.id,
            context: null,
            attachments: []
          }
        })

        if (!response.success || !response.data) {
          throw new Error(response.error ?? "Failed to send message")
        }

        handleConversationUpdate(response.data)
        setMessages(response.data.messages)
        setComposerInput("")
        setError(null)
      } catch (sendError) {
        setError((sendError as Error).message)
      } finally {
        setIsSending(false)
      }
    },
    [
      composerInput,
      config,
      handleConversationUpdate,
      selectedConversation,
      selectedModelId,
      selectedShortcut
    ]
  )

  const handleShortcutClick = (shortcutId: string) => {
    if (!config || isSending) {
      return
    }

    const shortcut = config.shortcuts.find((item) => item.id === shortcutId)
    if (!shortcut) {
      setSelectedShortcutId(shortcutId)
      return
    }

    setSelectedShortcutId(shortcutId)

    if (shortcut.prompt?.trim()) {
      void handleSend({ overridePrompt: shortcut.prompt, shortcut })
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      <aside
        className="border-r bg-white p-4 space-y-2 shrink-0"
        style={{ width: `${sidebarWidth}px` }}
      >
        <h1 className="text-lg font-semibold">{t("app.title")} history</h1>
        {error ? <div className="text-xs text-red-600">{error}</div> : null}
        <label className="block">
          <span className="sr-only">Search conversations</span>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Search by title"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            type="search"
          />
        </label>
        <div className="space-y-1 overflow-auto max-h-[calc(100vh-100px)]">
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`w-full text-left px-3 py-2 rounded border ${conversation.id === selectedId ? "bg-slate-900 text-white" : "bg-white"}`}
              onClick={() => setSelectedId(conversation.id)}
              type="button"
            >
              <div className="text-sm font-medium truncate">{conversation.title}</div>
              <div className="text-xs opacity-70 truncate">
                {new Date(conversation.updatedAt).toLocaleString()}
              </div>
            </button>
          ))}
          {filteredConversations.length === 0 ? (
            <div className="text-xs text-slate-500">
              {conversations.length === 0
                ? "No conversations yet."
                : "No conversations match your search."}
            </div>
          ) : null}
        </div>
      </aside>
      <div
        aria-hidden="true"
        className="w-1 cursor-col-resize bg-slate-200 hover:bg-slate-300"
        onPointerDown={beginResize}
        role="separator"
      />
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {selectedConversation ? (
          <>
            <div className="flex items-center justify-between gap-4 p-6 pb-4">
              <div className="flex flex-col gap-1">
                {isEditingTitle ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()

                      if (selectedConversation) {
                        void handleRename(selectedConversation, titleDraft)
                      }
                    }}
                  >
                    <input
                      ref={titleInputRef}
                      className="w-full rounded border border-slate-300 px-2 py-1 text-lg font-semibold"
                      value={titleDraft}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      onBlur={() => {
                        if (selectedConversation) {
                          void handleRename(selectedConversation, titleDraft)
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setIsEditingTitle(false)
                          setTitleDraft(selectedConversation?.title ?? "")
                        }
                      }}
                      aria-label="Conversation title"
                    />
                  </form>
                ) : (
                  <button
                    className="text-left text-xl font-semibold hover:underline"
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {selectedConversation.title}
                  </button>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>
                    Updated {new Date(selectedConversation.updatedAt).toLocaleString()}
                  </span>
                  {selectedConversation.url ? (
                    <a
                      className="truncate text-blue-600 hover:underline"
                      href={selectedConversation.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {selectedConversation.url}
                    </a>
                  ) : null}
                  {selectedConversation.shortcutId ? (
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-700">
                      Shortcut · {selectedConversation.shortcutId}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  disabled={renamingId === selectedConversation.id}
                >
                  {renamingId === selectedConversation.id ? "Renaming..." : "Rename"}
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  type="button"
                  onClick={() => handleDelete(selectedConversation)}
                  disabled={deletingId === selectedConversation.id}
                >
                  {deletingId === selectedConversation.id ? "Deleting..." : "Delete"}
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? "Exporting..." : "Export Markdown"}
                </button>
              </div>
            </div>
            {config ? (
              <div className="px-6 pb-2 flex flex-wrap gap-2">
                {config.shortcuts.map((shortcut) => (
                  <button
                    key={shortcut.id}
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      shortcut.id === selectedShortcutId
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                    onClick={() => handleShortcutClick(shortcut.id)}
                    type="button"
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex-1 overflow-auto px-6 pb-4 space-y-3">
              {messages.map((message) => (
                <article
                  className={`p-3 rounded border text-sm whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-white"
                      : "bg-slate-900 text-white"
                  }`}
                  key={message.id}
                >
                  <header className="text-xs opacity-70 mb-2 flex justify-between">
                    <span>{message.role}</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </header>
                  <div className="space-y-2">
                    {message.branchId ? (
                      <div
                        className={`text-[10px] uppercase tracking-wide ${
                          message.role === "user"
                            ? "text-slate-500"
                            : "text-slate-200"
                        }`}
                      >
                        Branch · {message.branchId}
                      </div>
                    ) : null}
                    {message.error ? (
                      <pre className="whitespace-pre-wrap rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">
                        {message.error}
                      </pre>
                    ) : null}
                    <div>{message.content}</div>
                    {message.attachments?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.attachments.map((attachment, index) => (
                          <figure
                            key={`${message.id}-attachment-${index}`}
                            className="rounded border border-slate-200 bg-white p-1"
                          >
                            <img
                              alt={`${attachment.mimeType} attachment ${index + 1}`}
                              className="max-h-24 max-w-[160px] object-contain"
                              src={attachment.dataUrl}
                            />
                            <figcaption className="mt-1 text-[10px] text-slate-500">
                              {attachment.mimeType}
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
              {messages.length === 0 ? (
                <div className="text-sm text-slate-500">
                  No messages yet. Use the composer below to start chatting again.
                </div>
              ) : null}
            </div>
            {config ? (
              <form
                className="border-t border-slate-200 bg-white p-6 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleSend()
                }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm font-medium text-slate-600">
                    Model
                    <select
                      className="ml-2 rounded border border-slate-300 px-2 py-1 text-sm"
                      disabled={!availableModels.length}
                      onChange={(event) => setSelectedModelId(event.target.value)}
                      value={selectedModelId ?? ""}
                    >
                      {availableModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedShortcut?.modelIds?.length ? (
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Multi-model ({selectedShortcut.modelIds.length})
                    </span>
                  ) : null}
                </div>
                <label className="block text-sm text-slate-600">
                  <span className="sr-only">Message</span>
                  <textarea
                    className="w-full min-h-[120px] resize-y rounded border border-slate-300 px-3 py-2 text-sm"
                    disabled={isSending}
                    onChange={(event) => setComposerInput(event.target.value)}
                    placeholder={
                      selectedShortcut?.prompt?.trim()
                        ? `Override shortcut prompt or submit to reuse “${selectedShortcut.label}”.`
                        : "Type your message"
                    }
                    value={composerInput}
                  />
                </label>
                <div className="flex items-center justify-between gap-4">
                  {error ? (
                    <div className="text-xs text-red-600">{error}</div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      Messages will send to the selected conversation and appear in the history above.
                    </div>
                  )}
                  <button
                    className="inline-flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    disabled={isSending || (!composerInput.trim() && !(selectedShortcut?.prompt?.trim()))}
                    type="submit"
                  >
                    {isSending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="border-t border-slate-200 bg-white px-6 py-4 text-sm text-slate-500">
                Loading configuration…
              </div>
            )}
          </>
        ) : (
          <div className="p-6 text-sm text-slate-500">
            Select a conversation to inspect its history.
          </div>
        )}
      </main>
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
        <ConversationsTab />
      </TranslationProvider>
    </StrictMode>
  )
}

mountTab()
