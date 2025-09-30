import { z } from "zod"

import { ExtractionModeSchema } from "../storage/schema"
import { ExtractionResultSchema } from "../extraction/types"
import { ConversationSchema } from "../conversation/schema"

export const ExtractionStatusSchema = z.enum([
  "idle",
  "loading",
  "ready",
  "error"
])

export const PageExtractionStateSchema = z.object({
  status: ExtractionStatusSchema,
  mode: ExtractionModeSchema,
  fetchedAt: z.number().optional(),
  result: ExtractionResultSchema.optional(),
  error: z.string().optional()
})

export const PageStateSchema = z.object({
  tabId: z.number().int(),
  conversationId: z.string().optional(),
  extraction: PageExtractionStateSchema,
  conversation: ConversationSchema.optional()
})

export type ExtractionStatus = z.infer<typeof ExtractionStatusSchema>
export type PageExtractionState = z.infer<typeof PageExtractionStateSchema>
export type PageState = z.infer<typeof PageStateSchema>
