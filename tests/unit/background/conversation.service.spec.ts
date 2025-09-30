import { beforeEach, describe, expect, it, vi } from "vitest"

import { createConversationService } from "../../../background/services/conversation"
import { createStorageService } from "../../../background/services/storage"
import { getDefaultConfig } from "../../../lib/storage/schema"
vi.mock("@plasmohq/storage", () => {
  class MemoryStorage {
    store = new Map<string, unknown>()
    async get<T>(key: string): Promise<T | null> {
      return (this.store.get(key) as T) ?? null
    }
    async set(key: string, value: unknown) {
      this.store.set(key, value)
    }
  }

  return { Storage: MemoryStorage }
})

describe("ConversationService", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("creates and appends messages", async () => {
    const storage = createStorageService()
    await storage.updateConfig(getDefaultConfig())
    const service = createConversationService(storage)

    const conversation = await service.ensureConversation({ title: "Test" })
    await service.appendMessage(conversation.id, {
      role: "user",
      content: "Hello",
      attachments: [],
      modelId: "openai:gpt-4o-mini"
    })

    const updated = await service.appendMessage(conversation.id, {
      role: "assistant",
      content: "Hi there!",
      attachments: [],
      modelId: "openai:gpt-4o-mini"
    })

    expect(updated.messages).toHaveLength(2)
    expect(updated.messages[1].content).toContain("Hi there")
  })

  it("exports conversations to markdown", async () => {
    const storage = createStorageService()
    await storage.updateConfig(getDefaultConfig())
    const service = createConversationService(storage)

    const conversation = await service.ensureConversation({
      title: "Research Notes",
      url: "https://example.com/post"
    })

    const populated = await service.appendMessage(conversation.id, {
      role: "user",
      content: "What are the key findings?",
      modelId: "openai:gpt-4o-mini",
      attachments: [
        {
          type: "image",
          mimeType: "image/png",
          dataUrl: "data:image/png;base64,AAAA"
        }
      ]
    })

    const markdown = await service.exportMarkdown(populated.id)

    expect(markdown).toContain("# Research Notes")
    expect(markdown).toContain("[Source](https://example.com/post)")
    expect(markdown).toContain("## USER")
    expect(markdown).toContain("What are the key findings?")
    expect(markdown).toContain("![attachment-1](data:image/png;base64,AAAA)")
  })

  it("updates conversation metadata and deletes entries", async () => {
    const storage = createStorageService()
    await storage.updateConfig(getDefaultConfig())
    const service = createConversationService(storage)

    const conversation = await service.ensureConversation({
      title: "Draft",
      shortcutId: "shortcut-1"
    })

    const renamed = await service.updateMeta(conversation.id, {
      title: " Renamed Conversation  ",
      url: "https://example.com/article"
    })

    expect(renamed.title).toBe("Renamed Conversation")
    expect(renamed.url).toBe("https://example.com/article")
    expect(renamed.updatedAt).toBeGreaterThan(conversation.updatedAt)

    await service.remove(conversation.id)

    const list = await service.list()
    expect(list.find((item) => item.id === conversation.id)).toBeUndefined()
  })

  it("sorts conversations by last update when listing", async () => {
    const storage = createStorageService()
    await storage.updateConfig(getDefaultConfig())
    const service = createConversationService(storage)

    const first = await service.ensureConversation({ title: "First" })
    const second = await service.ensureConversation({ title: "Second" })

    await service.appendMessage(second.id, {
      role: "user",
      content: "Hi",
      modelId: "openai:gpt-4o-mini",
      attachments: []
    })

    const ordered = await service.list()
    expect(ordered[0]?.id).toBe(second.id)

    await service.updateMeta(first.id, { title: "First updated" })

    const reordered = await service.list()
    expect(reordered[0]?.id).toBe(first.id)
  })
})
