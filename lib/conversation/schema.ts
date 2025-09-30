import { z } from "zod"

export const ConversationRoleSchema = z.enum([
  "system",
  "user",
  "assistant"
])

export const AttachmentSchema = z.object({
  type: z.enum(["image"]),
  mimeType: z.string(),
  dataUrl: z.string()
})

export const ConversationMessageSchema = z.object({
  id: z.string(),
  role: ConversationRoleSchema,
  content: z.string(),
  createdAt: z.number().int(),
  modelId: z.string().optional(),
  branchId: z.string().optional(),
  isStreaming: z.boolean().default(false),
  error: z.string().optional(),
  attachments: z.array(AttachmentSchema).default([])
})

export const ConversationSchema = z.object({
  id: z.string(),
  tabId: z.number().int(),
  title: z.string(),
  url: z.string().optional(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  shortcutId: z.string().optional(),
  messages: z.array(ConversationMessageSchema)
})

export const ConversationCollectionSchema = z.record(ConversationSchema)

export type ConversationRole = z.infer<typeof ConversationRoleSchema>
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>
export type Conversation = z.infer<typeof ConversationSchema>
export type ConversationCollection = z.infer<typeof ConversationCollectionSchema>
