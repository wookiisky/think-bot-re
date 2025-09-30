import { describe, expect, it } from "vitest"

import type { Conversation } from "../../lib/conversation/schema"
import { sortConversations, upsertConversation } from "../../tabs/conversations-utils"

const createConversation = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: overrides.id ?? `conv-${Math.random().toString(36).slice(2, 10)}`,
  tabId: overrides.tabId ?? 1,
  title: overrides.title ?? "Conversation",
  url: overrides.url,
  shortcutId: overrides.shortcutId,
  createdAt: overrides.createdAt ?? Date.now(),
  updatedAt: overrides.updatedAt ?? Date.now(),
  messages: overrides.messages ?? []
})

describe("conversations utils", () => {
  it("sorts conversations by updatedAt descending", () => {
    const older = createConversation({ id: "older", updatedAt: 1 })
    const newer = createConversation({ id: "newer", updatedAt: 10 })

    const sorted = sortConversations([older, newer])

    expect(sorted[0].id).toBe("newer")
    expect(sorted[1].id).toBe("older")
  })

  it("upserts and keeps list ordered", () => {
    const first = createConversation({ id: "first", updatedAt: 5 })
    const second = createConversation({ id: "second", updatedAt: 10 })
    const list = [first, second]

    const updated = upsertConversation(list, createConversation({ id: "first", updatedAt: 20 }))

    expect(updated[0].id).toBe("first")
    expect(updated[1].id).toBe("second")
    expect(updated).toHaveLength(2)
  })
})
