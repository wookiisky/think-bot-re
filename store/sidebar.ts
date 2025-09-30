import { create } from "zustand"

import { sendBackgroundMessage } from "../lib/messaging/client"
import type { Conversation } from "../lib/conversation/schema"
import type { ConversationMessage } from "../lib/conversation/schema"
import type { Attachment } from "../lib/conversation/schema"
import type { Config, ExtractionMode } from "../lib/storage/schema"
import { getDefaultConfig } from "../lib/storage/schema"

export interface SidebarAttachment extends Attachment {
  id: string
  name?: string
}

interface SidebarState {
  config: Config
  ready: boolean
  error?: string
  extraction: {
    mode: ExtractionMode
    status: "idle" | "loading" | "ready" | "error"
    title: string
    content: string
    source: string
  }
  extractionHeight: number
  conversation: Conversation | null
  messages: ConversationMessage[]
  selectedShortcutId: string
  input: string
  attachContent: boolean
  isSending: boolean
  attachments: SidebarAttachment[]
  load: () => Promise<void>
  triggerExtraction: (mode: ExtractionMode) => Promise<void>
  sendMessage: (overridePrompt?: string) => Promise<void>
  clearConversation: () => Promise<void>
  setInput: (value: string) => void
  setSelectedShortcut: (id: string) => void
  toggleAttachContent: () => void
  addAttachment: (attachment: SidebarAttachment) => void
  removeAttachment: (id: string) => void
  clearAttachments: () => void
  setExtractionHeight: (height: number) => void
}

const resolveDefaultShortcut = (config: Config) => config.shortcuts[0]?.id ?? "chat"

export const useSidebarStore = create<SidebarState>((set, get) => ({
  config: getDefaultConfig(),
  ready: false,
  extraction: {
    mode: "readability",
    status: "idle",
    title: "",
    content: "",
    source: "readability"
  },
  extractionHeight: getDefaultConfig().general.sidebarHeight,
  conversation: null,
  messages: [],
  selectedShortcutId: "chat",
  input: "",
  attachContent: true,
  isSending: false,
  attachments: [],
  load: async () => {
    try {
      const [configResponse, stateResponse] = await Promise.all([
        sendBackgroundMessage({ type: "config:get", payload: undefined }),
        sendBackgroundMessage({ type: "page-state:get", payload: {} })
      ])

      if (!configResponse.success || !configResponse.data) {
        throw new Error(configResponse.error ?? "Failed to fetch config")
      }

      const config = configResponse.data
      const attachContent = config.general.attachPageContent

      set({
        config,
        selectedShortcutId: resolveDefaultShortcut(config),
        attachContent,
        ready: true,
        error: undefined,
        extractionHeight: config.general.sidebarHeight
      })

      if (stateResponse.success && stateResponse.data) {
        const { extraction, conversation } = stateResponse.data

        if (extraction?.result) {
          set({
            extraction: {
              mode: extraction.mode,
              status: extraction.status,
              title: extraction.result.title,
              content: extraction.result.content,
              source: extraction.result.source
            }
          })
        }

        if (conversation) {
          set({
            conversation,
            messages: conversation.messages
          })
        }
      }

      const autoShortcut = config.shortcuts.find((item) => item.autoTrigger)

      if (autoShortcut && get().messages.length === 0) {
        await get().sendMessage(autoShortcut.prompt)
      }
    } catch (error) {
      console.error("[store][sidebar] load failed", error)
      set({
        ready: true,
        error: (error as Error).message
      })
    }
  },
  triggerExtraction: async (mode) => {
    set({
      extraction: {
        ...get().extraction,
        status: "loading",
        mode
      }
    })

    try {
      const response = await sendBackgroundMessage({
        type: "extract:run",
        payload: { mode }
      })

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Extraction failed")
      }

      set({
        extraction: {
          mode,
          status: "ready",
          title: response.data.title,
          content: response.data.content,
          source: response.data.source
        }
      })
    } catch (error) {
      console.error("[store][sidebar] extraction error", error)
      set({
        extraction: {
          ...get().extraction,
          status: "error"
        }
      })
    }
  },
  sendMessage: async (overridePrompt) => {
    const state = get()
    const {
      input,
      selectedShortcutId,
      config,
      conversation,
      extraction,
      attachments
    } = state

    const shortcut = config.shortcuts.find((item) => item.id === selectedShortcutId)
    const shortcutPrompt = shortcut?.prompt?.trim()
    const prompt = overridePrompt ?? (shortcutPrompt ? shortcut.prompt : input)
    const modelIds =
      shortcut?.modelIds.length
        ? shortcut.modelIds
        : [config.general.defaultModelId]
    const primaryModelId = modelIds[0] ?? config.general.defaultModelId

    if (!prompt.trim()) {
      return
    }

    set({ isSending: true })

    try {
      const response = await sendBackgroundMessage({
        type: "conversation:append",
        payload: {
          conversationId: conversation?.id,
          message: prompt,
          modelId: primaryModelId,
          modelIds,
          shortcutId: shortcut?.id,
          context: state.attachContent ? extraction.content : null,
          attachments: attachments.map(({ id: _id, name: _name, ...rest }) => rest)
        }
      })

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Message failed")
      }

      set({
        conversation: response.data,
        messages: response.data.messages,
        input: "",
        attachments: []
      })
    } catch (error) {
      console.error("[store][sidebar] send failed", error)
      set({ error: (error as Error).message })
    } finally {
      set({ isSending: false })
    }
  },
  clearConversation: async () => {
    const { conversation } = get()

    if (!conversation) {
      return
    }

    try {
      const response = await sendBackgroundMessage({
        type: "conversation:clear",
        payload: { conversationId: conversation.id }
      })

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Unable to clear conversation")
      }

      set({ conversation: response.data, messages: response.data.messages })
    } catch (error) {
      set({ error: (error as Error).message })
    }
  },
  setInput: (value) => set({ input: value }),
  setSelectedShortcut: (id) => set({ selectedShortcutId: id }),
  toggleAttachContent: () => set((current) => ({
    attachContent: !current.attachContent
  })),
  addAttachment: (attachment) =>
    set((current) => ({ attachments: [...current.attachments, attachment] })),
  removeAttachment: (id) =>
    set((current) => ({
      attachments: current.attachments.filter((item) => item.id !== id)
    })),
  clearAttachments: () => set({ attachments: [] }),
  setExtractionHeight: (height) =>
    set((current) => ({
      extractionHeight: Math.min(Math.max(height, 200), 720)
    }))
}))
