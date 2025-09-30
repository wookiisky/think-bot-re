import { beforeEach, describe, expect, it, vi } from "vitest"

import { useSidebarStore } from "../../../store/sidebar"
import { getDefaultConfig } from "../../../lib/storage/schema"
import type { Conversation } from "../../../lib/conversation/schema"
import { sendBackgroundMessage } from "../../../lib/messaging/client"

vi.mock("../../../lib/messaging/client", () => ({
  sendBackgroundMessage: vi.fn()
}))

const mockConversation = (): Conversation => ({
  id: "conv-1",
  tabId: 1,
  title: "Test",
  url: "https://example.com",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  shortcutId: "chat",
  messages: []
})

describe("useSidebarStore", () => {
  const mockSend = vi.mocked(sendBackgroundMessage)

  beforeEach(() => {
    vi.clearAllMocks()
    const config = getDefaultConfig()
    useSidebarStore.setState({
      config,
      ready: true,
      extraction: {
        mode: "readability",
        status: "ready",
        title: "Example",
        content: "Example content",
        source: "readability"
      },
      extractionHeight: config.general.sidebarHeight,
      conversation: mockConversation(),
      messages: [],
      selectedShortcutId: "chat",
      input: "Hello",
      attachContent: true,
      isSending: false,
      attachments: [],
      error: undefined
    })
  })

  it("clamps extraction height between bounds", () => {
    useSidebarStore.getState().setExtractionHeight(50)
    expect(useSidebarStore.getState().extractionHeight).toBe(200)

    useSidebarStore.getState().setExtractionHeight(1000)
    expect(useSidebarStore.getState().extractionHeight).toBe(720)
  })

  it("adds and removes attachments", () => {
    const attachment = {
      id: "att-1",
      type: "image" as const,
      mimeType: "image/png",
      dataUrl: "data:image/png;base64,AAAA"
    }

    useSidebarStore.getState().addAttachment(attachment)
    expect(useSidebarStore.getState().attachments).toEqual([attachment])

    useSidebarStore.getState().removeAttachment("att-1")
    expect(useSidebarStore.getState().attachments).toEqual([])
  })

  it("passes attachments through conversation append", async () => {
    const conversation = mockConversation()
    mockSend.mockResolvedValueOnce({ success: true, data: conversation })

    useSidebarStore.getState().addAttachment({
      id: "att-1",
      type: "image",
      mimeType: "image/png",
      dataUrl: "data:image/png;base64,AAAA"
    })

    await useSidebarStore.getState().sendMessage()

    expect(mockSend).toHaveBeenCalledWith({
      type: "conversation:append",
      payload: expect.objectContaining({
        attachments: [
          {
            type: "image",
            mimeType: "image/png",
            dataUrl: "data:image/png;base64,AAAA"
          }
        ]
      })
    })
    expect(useSidebarStore.getState().attachments).toEqual([])
  })
})
