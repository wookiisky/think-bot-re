import { z } from "zod"

export const ConfigSchema = z.object({
  language: z.string().default("en"),
  defaultProvider: z.string().default("openai")
})

export type Config = z.infer<typeof ConfigSchema>

export const getDefaultConfig = (): Config => ConfigSchema.parse({})
