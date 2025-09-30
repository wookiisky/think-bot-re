import type { MessagingRequestType } from "./contracts"
import type { MessagingEnvelope, MessagingResponse } from "./contracts"

import { createStorageService } from "~background/services/storage"
import { createExtractionService } from "~background/services/extractor"
import { createSyncService } from "~background/services/sync"
import { createPageStateService } from "~background/services/page-state"
import { createConversationService } from "~background/services/conversation"
import { createLLMProvider, runLLMStream } from "~background/services/llm"
import { createStreamingAssembler } from "~background/services/llm/streaming"
import { getDefaultConfig } from "../storage/schema"

type HandlerMap = {
  [Key in MessagingRequestType]: (
    payload: MessagingEnvelope<Key>["payload"],
    sender: chrome.runtime.MessageSender
  ) => Promise<MessagingResponse<Key>["data"]>
}

export const registerBackgroundHandlers = (): (() => void) => {
  console.info("[messaging] register background handlers")

  const storage = createStorageService()
  const extraction = createExtractionService()
  const pageState = createPageStateService()
  const conversationService = createConversationService(storage)
  const sync = createSyncService(storage)

  const handlers: HandlerMap = {
    "config:get": async () => {
      const snapshot = await storage.readSnapshot()
      return snapshot.config
    },
    "config:set": async (config) => {
      const next = await storage.updateConfig(config)
      return next
    },
    "config:reset": async () => {
      const next = await storage.updateConfig(getDefaultConfig())
      return next
    },
    "page-state:get": async ({ tabId }, sender) => {
      const snapshot = await storage.readSnapshot()
      const mode = snapshot.config.extraction.defaultMode
      const id = tabId ?? sender.tab?.id

      if (typeof id !== "number") {
        return null
      }

      const state = pageState.ensure(id, mode)
      const conversation = state.conversationId
        ? await conversationService.get(state.conversationId)
        : null

      return {
        ...state,
        conversation: conversation ?? undefined
      }
    },
    "extract:run": async ({ mode }, sender) => {
      const { result, tabId } = await extraction.extractActivePage({ mode })

      pageState.ensure(tabId, mode)
      pageState.setExtraction(tabId, {
        status: "ready",
        mode,
        result,
        fetchedAt: Date.now(),
        error: undefined
      })

      if (!pageState.get(tabId)?.conversationId) {
        const conversation = await conversationService.ensureConversation({
          tabId,
          title: sender.tab?.title,
          url: sender.tab?.url ?? undefined
        })
        pageState.setConversation(tabId, conversation.id)
      }

      return result
    },
    "conversation:list": async () => {
      return conversationService.list()
    },
    "conversation:get": async ({ conversationId }) => {
      return conversationService.get(conversationId)
    },
    "conversation:append": async (
      {
        conversationId,
        tabId,
        title,
        url,
        message,
        modelId,
        modelIds,
        shortcutId,
        context,
        attachments
      },
      sender
    ) => {
      const snapshot = await storage.readSnapshot()
      const requestedIds = (modelIds?.length ? modelIds : [modelId]).filter(Boolean)
      const models = requestedIds
        .map((id) => snapshot.config.models.find((item) => item.id === id && !item.disabled))
        .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))

      if (models.length === 0) {
        throw new Error(`no enabled models available for request`)
      }

      const primaryModel = models[0]

      const resolvedConversation = await conversationService.ensureConversation({
        conversationId,
        tabId: tabId ?? sender.tab?.id,
        title: title ?? sender.tab?.title,
        url: url ?? sender.tab?.url ?? undefined,
        shortcutId
      })

      const conversationIdToUse = resolvedConversation.id

      if (shortcutId && resolvedConversation.shortcutId !== shortcutId) {
        await conversationService.updateMeta(conversationIdToUse, { shortcutId })
      }

      await conversationService.appendMessage(conversationIdToUse, {
        role: "user",
        content: message,
        modelId: primaryModel.id,
        attachments: attachments ?? []
      })

      let latestConversation = await conversationService.get(conversationIdToUse)

      for (const activeModel of models) {
        const provider = createLLMProvider(activeModel)
        const assembler = createStreamingAssembler()
        const assistantMessageId = createId()
        const branchId = `${activeModel.id}-${assistantMessageId}`

        latestConversation = await conversationService.appendMessage(
          conversationIdToUse,
          {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            modelId: activeModel.id,
            branchId,
            isStreaming: true,
            attachments: []
          }
        )

        try {
          const text = await runLLMStream(
            provider,
            {
              model: activeModel.model,
              prompt: message,
              context:
                context ??
                pageState.get(resolvedConversation.tabId)?.extraction.result?.content ??
                  null,
              systemPrompt: snapshot.config.general.systemPrompt,
              history: latestConversation?.messages
            },
            (chunk) => {
              assembler.push({
                id: assistantMessageId,
                data: chunk
              })
            }
          )

          const finalContent = assembler.complete() || text

          latestConversation = await conversationService.updateMessage(
            conversationIdToUse,
            assistantMessageId,
            {
              content: finalContent,
              isStreaming: false,
              error: undefined
            }
          )
        } catch (streamError) {
          latestConversation = await conversationService.updateMessage(
            conversationIdToUse,
            assistantMessageId,
            {
              isStreaming: false,
              error: (streamError as Error).message
            }
          )
        }
      }

      if (resolvedConversation.tabId) {
        pageState.setConversation(resolvedConversation.tabId, conversationIdToUse)
      }

      const finalConversation =
        latestConversation ?? (await conversationService.get(conversationIdToUse))

      return finalConversation ?? (await conversationService.ensureConversation({ conversationId: conversationIdToUse }))
    },
    "conversation:update": async ({ conversationId, title, shortcutId, url }) => {
      return conversationService.updateMeta(conversationId, {
        title,
        shortcutId,
        url
      })
    },
    "conversation:clear": async ({ conversationId }) => {
      return conversationService.clear(conversationId)
    },
    "conversation:delete": async ({ conversationId }) => {
      await conversationService.remove(conversationId)
      return { success: true }
    },
    "conversation:export": async ({ conversationId, format }) => {
      const conversation = await conversationService.get(conversationId)

      if (!conversation) {
        throw new Error(`conversation ${conversationId} missing`)
      }

      const formatToUse = format ?? "markdown"

      if (formatToUse !== "markdown") {
        throw new Error(`unsupported export format: ${formatToUse}`)
      }

      const content = await conversationService.exportMarkdown(conversationId)
      const slug = conversation.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")

      const fileName = `${slug || "conversation"}-${conversation.id.slice(0, 8)}.md`

      return {
        format: "markdown" as const,
        fileName,
        content
      }
    },
    "sync:run": async () => {
      const result = await sync.sync()
      return {
        completedAt: result.completedAt
      }
    }
  }

  const listener: Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (
    message,
    sender,
    sendResponse
  ) => {
    const envelope = message as MessagingEnvelope<MessagingRequestType>
    const handler = handlers[envelope.type]

    if (!handler) {
      return false
    }

    handler(envelope.payload, sender)
      .then((data) => {
        sendResponse({ success: true, data })
      })
      .catch((error) => {
        console.error("[messaging] handler failed", envelope.type, error)
        sendResponse({ success: false, error: (error as Error).message })
      })

    return true
  }

  chrome.runtime.onMessage.addListener(listener)

  return () => {
    chrome.runtime.onMessage.removeListener(listener)
    console.info("[messaging] dispose background handlers")
  }
}

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `msg_${Math.random().toString(36).slice(2, 10)}`
}
