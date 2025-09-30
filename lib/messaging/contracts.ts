import type { Conversation } from "../conversation/schema"
import type { Attachment } from "../conversation/schema"
import type { ExtractionResult } from "../extraction/types"
import type { PageState } from "../page-state/schema"
import type { Config, ExtractionMode } from "../storage/schema"

export interface MessagingRequestMap {
  "config:get": {
    request: void
    response: Config
  }
  "config:set": {
    request: Config
    response: Config
  }
  "config:reset": {
    request: void
    response: Config
  }
  "page-state:get": {
    request: { tabId?: number }
    response: PageState | null
  }
  "extract:run": {
    request: { mode: ExtractionMode }
    response: ExtractionResult
  }
  "conversation:list": {
    request: void
    response: Conversation[]
  }
  "conversation:get": {
    request: { conversationId: string }
    response: Conversation | null
  }
  "conversation:append": {
    request: {
      conversationId?: string
      tabId?: number
      title?: string
      url?: string
      message: string
      modelId: string
      modelIds?: string[]
      shortcutId?: string
      context?: string | null
      attachments?: Attachment[]
    }
    response: Conversation
  }
  "conversation:update": {
    request: {
      conversationId: string
      title?: string
      shortcutId?: string
      url?: string
    }
    response: Conversation
  }
  "conversation:clear": {
    request: { conversationId: string }
    response: Conversation
  }
  "conversation:delete": {
    request: { conversationId: string }
    response: { success: true }
  }
  "conversation:export": {
    request: { conversationId: string; format?: "markdown" }
    response: { format: "markdown"; fileName: string; content: string }
  }
  "sync:run": {
    request: void
    response: { completedAt: number }
  }
}

export type MessagingRequestType = keyof MessagingRequestMap

export interface MessagingEnvelope<TType extends MessagingRequestType> {
  type: TType
  payload: MessagingRequestMap[TType]["request"]
}

export interface MessagingResponse<
  TType extends MessagingRequestType
> {
  success: boolean
  data?: MessagingRequestMap[TType]["response"]
  error?: string
}
