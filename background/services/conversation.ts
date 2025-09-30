import {
  type Conversation,
  type ConversationCollection,
  type ConversationMessage,
  ConversationCollectionSchema,
  ConversationSchema
} from "../../lib/conversation/schema"
import { conversationToMarkdown } from "../../lib/conversation/export"
import type { StorageService } from "./storage"

export interface ConversationInit {
  conversationId?: string
  tabId?: number
  title?: string
  url?: string
  shortcutId?: string
}

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `conv_${Math.random().toString(36).slice(2, 10)}`
}

export class ConversationService {
  private conversations: ConversationCollection = {}
  private isLoaded = false

  constructor(private readonly storage: StorageService) {}

  async list(): Promise<Conversation[]> {
    await this.ensureLoaded()
    return Object.values(this.conversations).sort(
      (a, b) => b.updatedAt - a.updatedAt
    )
  }

  async get(conversationId: string): Promise<Conversation | null> {
    await this.ensureLoaded()
    const conversation = this.conversations[conversationId]
    return conversation ? { ...conversation } : null
  }

  async ensureConversation(init: ConversationInit): Promise<Conversation> {
    await this.ensureLoaded()

    if (init.conversationId) {
      const existing = this.conversations[init.conversationId]

      if (existing) {
        return existing
      }
    }

    const now = Date.now()
    const id = init.conversationId ?? createId()

    const conversation: Conversation = ConversationSchema.parse({
      id,
      tabId: init.tabId ?? -1,
      title: init.title ?? "Untitled conversation",
      url: init.url,
      shortcutId: init.shortcutId,
      createdAt: now,
      updatedAt: now,
      messages: []
    })

    this.conversations[id] = conversation
    await this.persist()
    return conversation
  }

  async appendMessage(
    conversationId: string,
    message: Omit<ConversationMessage, "createdAt" | "id"> & {
      id?: string
      createdAt?: number
    }
  ): Promise<Conversation> {
    await this.ensureLoaded()
    const conversation = this.conversations[conversationId]

    if (!conversation) {
      throw new Error(`conversation ${conversationId} missing`)
    }

    const entry: ConversationMessage = {
      id: message.id ?? createId(),
      createdAt: message.createdAt ?? Date.now(),
      role: message.role,
      content: message.content,
      attachments: message.attachments ?? [],
      modelId: message.modelId,
      branchId: message.branchId,
      isStreaming: message.isStreaming ?? false,
      error: message.error
    }

    conversation.messages = [...conversation.messages, entry]
    conversation.updatedAt = entry.createdAt
    this.conversations[conversationId] = conversation

    await this.persist()

    return conversation
  }

  async updateMessage(
    conversationId: string,
    messageId: string,
    patch: Partial<ConversationMessage>
  ): Promise<Conversation> {
    await this.ensureLoaded()
    const conversation = this.conversations[conversationId]

    if (!conversation) {
      throw new Error(`conversation ${conversationId} missing`)
    }

    const index = conversation.messages.findIndex((item) => item.id === messageId)

    if (index === -1) {
      throw new Error(`message ${messageId} missing`)
    }

    const nextMessage: ConversationMessage = {
      ...conversation.messages[index],
      ...patch
    }

    const nextConversation: Conversation = {
      ...conversation,
      messages: [
        ...conversation.messages.slice(0, index),
        nextMessage,
        ...conversation.messages.slice(index + 1)
      ],
      updatedAt: Date.now()
    }

    this.conversations[conversationId] = nextConversation
    await this.persist()
    return nextConversation
  }

  async updateMeta(
    conversationId: string,
    patch: Partial<Pick<Conversation, "title" | "shortcutId" | "url">>
  ): Promise<Conversation> {
    await this.ensureLoaded()
    const conversation = this.conversations[conversationId]

    if (!conversation) {
      throw new Error(`conversation ${conversationId} missing`)
    }

    const timestamp = Math.max(Date.now(), conversation.updatedAt + 1)

    const sanitizedPatch: Partial<Pick<Conversation, "title" | "shortcutId" | "url">> = {
      ...patch,
      title: patch.title?.trim(),
      shortcutId: patch.shortcutId?.trim(),
      url: patch.url?.trim()
    }

    const nextConversation: Conversation = ConversationSchema.parse({
      ...conversation,
      ...sanitizedPatch,
      updatedAt: timestamp
    })

    this.conversations[conversationId] = nextConversation
    await this.persist()
    return nextConversation
  }

  async clear(conversationId: string): Promise<Conversation> {
    await this.ensureLoaded()
    const conversation = this.conversations[conversationId]

    if (!conversation) {
      throw new Error(`conversation ${conversationId} missing`)
    }

    const cleared: Conversation = {
      ...conversation,
      messages: [],
      updatedAt: Date.now()
    }

    this.conversations[conversationId] = cleared
    await this.persist()
    return cleared
  }

  async remove(conversationId: string): Promise<void> {
    await this.ensureLoaded()
    delete this.conversations[conversationId]
    await this.persist()
  }

  async exportMarkdown(conversationId: string): Promise<string> {
    await this.ensureLoaded()
    const conversation = this.conversations[conversationId]

    if (!conversation) {
      throw new Error(`conversation ${conversationId} missing`)
    }

    return conversationToMarkdown(conversation)
  }

  private async ensureLoaded(): Promise<void> {
    if (this.isLoaded) {
      return
    }

    const snapshot = await this.storage.readSnapshot()
    this.conversations = ConversationCollectionSchema.parse(snapshot.conversations)
    this.isLoaded = true
  }

  private async persist(): Promise<void> {
    const serialisable = ConversationCollectionSchema.parse(this.conversations)
    await this.storage.updateConversations(serialisable)
  }
}

export const createConversationService = (storage: StorageService) =>
  new ConversationService(storage)
