import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDefaultConfig } from "../../../lib/storage/schema"

const storage = {
  readSnapshot: vi.fn(),
  updateConfig: vi.fn()
}
const extraction = {
  extractActivePage: vi.fn()
}
const conversation = {
  ensureConversation: vi.fn(),
  updateMeta: vi.fn(),
  appendMessage: vi.fn(),
  get: vi.fn(),
  updateMessage: vi.fn(),
  clear: vi.fn(),
  list: vi.fn(),
  exportMarkdown: vi.fn(),
  remove: vi.fn()
}
const pageState = {
  ensure: vi.fn(),
  setExtraction: vi.fn(),
  get: vi.fn(),
  setConversation: vi.fn()
}
const sync = {
  sync: vi.fn()
}

const createLLMProvider = vi.fn()
const runLLMStream = vi.fn()

let assemblerCall = 0
const assemblerInstances: Array<{ push: ReturnType<typeof vi.fn>; complete: ReturnType<typeof vi.fn> }> = []
const createStreamingAssembler = vi.fn(() => {
  const push = vi.fn()
  const complete = vi.fn().mockReturnValue(assemblerCall === 0 ? "assembled-first" : "")
  assemblerCall += 1
  const instance = { push, complete }
  assemblerInstances.push(instance)
  return instance
})

vi.mock("~background/services/storage", () => ({
  createStorageService: () => storage
}))
vi.mock("~background/services/extractor", () => ({
  createExtractionService: () => extraction
}))
vi.mock("~background/services/conversation", () => ({
  createConversationService: () => conversation
}))
vi.mock("~background/services/page-state", () => ({
  createPageStateService: () => pageState
}))
vi.mock("~background/services/sync", () => ({
  createSyncService: () => sync
}))
vi.mock("~background/services/llm", () => ({
  createLLMProvider: (...args: unknown[]) => createLLMProvider(...(args as Parameters<typeof createLLMProvider>)),
  runLLMStream: (...args: unknown[]) => runLLMStream(...(args as Parameters<typeof runLLMStream>))
}))
vi.mock("~background/services/llm/streaming", () => ({
  createStreamingAssembler: () => createStreamingAssembler()
}))

import { registerBackgroundHandlers } from "../../../lib/messaging/handlers"

describe("conversation:append handler", () => {
  const listeners: Array<Parameters<typeof chrome.runtime.onMessage.addListener>[0]> = []

  beforeEach(() => {
    assemblerCall = 0
    assemblerInstances.length = 0
    vi.clearAllMocks()

    const config = getDefaultConfig()
    config.general.systemPrompt = "You are helpful."
    storage.readSnapshot.mockResolvedValue({
      version: 1,
      config,
      conversations: {}
    })

    const baseConversation = {
      id: "conv-1",
      tabId: 99,
      title: "Example Tab",
      url: "https://example.com",
      shortcutId: "chat",
      messages: []
    }

    conversation.ensureConversation.mockResolvedValue(baseConversation)
    conversation.get.mockResolvedValue(baseConversation)
    conversation.appendMessage.mockResolvedValue(baseConversation)
    conversation.updateMessage.mockResolvedValue(baseConversation)

    pageState.get.mockReturnValue({
      extraction: {
        result: {
          content: "Context from extraction"
        }
      }
    })

    ;(globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome = {
      runtime: {
        lastError: undefined,
        onMessage: {
          addListener: vi.fn((listener) => {
            listeners.push(listener)
          }),
          removeListener: vi.fn()
        }
      }
    } as unknown as typeof chrome

    createLLMProvider.mockImplementation((model) => ({
      id: model.id,
      createStream: vi.fn()
    }))
    runLLMStream.mockImplementationOnce(async (_provider, _request, onChunk) => {
      onChunk("first-chunk")
      return "first-provider-output"
    })
    runLLMStream.mockImplementationOnce(async () => {
      throw new Error("provider-failure")
    })

    listeners.length = 0
    registerBackgroundHandlers()
  })

  it("streams responses for each enabled model and captures failures", async () => {
    const handler = listeners[0]
    expect(handler).toBeDefined()

    const sendResponse = vi.fn()

    const message = {
      type: "conversation:append" as const,
      payload: {
        conversationId: undefined,
        tabId: 99,
        title: "Example Tab",
        url: "https://example.com",
        message: "Hello from sidebar",
        modelId: "openai:gpt-4o-mini",
        modelIds: ["openai:gpt-4o-mini", "gemini:flash"],
        shortcutId: "chat",
        context: null,
        attachments: [
          {
            type: "image" as const,
            mimeType: "image/png",
            dataUrl: "data:image/png;base64,AAAA"
          }
        ]
      }
    }

    const sender = {
      tab: {
        id: 99,
        title: "Example Tab",
        url: "https://example.com"
      }
    }

    const handled = handler(message, sender, sendResponse)
    expect(handled).toBe(true)

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalled()
    })

    const response = sendResponse.mock.calls[0][0]
    expect(response.success).toBe(true)

    expect(conversation.appendMessage).toHaveBeenCalledTimes(1 + message.payload.modelIds.length)
    const [userAppend] = conversation.appendMessage.mock.calls
    expect(userAppend[1]).toMatchObject({
      role: "user",
      content: "Hello from sidebar",
      attachments: [
        {
          type: "image",
          mimeType: "image/png",
          dataUrl: "data:image/png;base64,AAAA"
        }
      ]
    })

    const assistantIds = conversation.appendMessage.mock.calls
      .filter(([, details]) => details.role === "assistant")
      .map(([, details]) => details.id)

    expect(createLLMProvider).toHaveBeenCalledTimes(2)
    expect(runLLMStream).toHaveBeenCalledTimes(2)
    expect(runLLMStream.mock.calls[0][1]).toMatchObject({
      model: "gpt-4o-mini",
      prompt: "Hello from sidebar",
      systemPrompt: "You are helpful.",
      context: "Context from extraction"
    })

    expect(conversation.updateMessage).toHaveBeenCalledTimes(2)
    expect(conversation.updateMessage.mock.calls[0][1]).toBe(assistantIds[0])
    expect(conversation.updateMessage.mock.calls[0][2]).toEqual({
      content: "assembled-first",
      isStreaming: false,
      error: undefined
    })
    expect(conversation.updateMessage.mock.calls[1][1]).toBe(assistantIds[1])
    expect(conversation.updateMessage.mock.calls[1][2]).toEqual({
      isStreaming: false,
      error: "provider-failure"
    })

    expect(createStreamingAssembler).toHaveBeenCalledTimes(2)
    expect(assemblerInstances[0].push).toHaveBeenCalled()
    expect(pageState.setConversation).toHaveBeenCalledWith(99, "conv-1")
  })
})
