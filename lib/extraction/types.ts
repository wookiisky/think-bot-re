import { z } from "zod"

import { ExtractionModeSchema } from "../storage/schema"

export const ExtractionResultSchema = z.object({
  title: z.string(),
  content: z.string(),
  source: ExtractionModeSchema
})

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>
