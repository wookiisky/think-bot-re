import { z } from "zod"

export const STORAGE_VERSION = 1

export const ThemeSchema = z.enum(["light", "dark", "system"])
export const LanguageSchema = z.enum(["en", "zh"])

export const ExtractionModeSchema = z.enum(["readability", "jina"])
export type ExtractionMode = z.infer<typeof ExtractionModeSchema>

export const ShortcutSchema = z.object({
  id: z.string(),
  label: z.string(),
  prompt: z.string(),
  autoTrigger: z.boolean().default(false),
  modelIds: z.array(z.string()).default([])
})

export const LanguageModelSchema = z.object({
  id: z.string(),
  label: z.string(),
  provider: z.enum(["openai", "gemini", "azure", "bedrock"]),
  model: z.string(),
  apiKey: z.string().optional(),
  endpoint: z.string().url().optional(),
  deploymentId: z.string().optional(),
  supportsImages: z.boolean().default(false),
  streaming: z.boolean().default(true),
  disabled: z.boolean().default(false)
})

export const SyncProviderSchema = z.enum(["none", "gist", "webdav"])

export const GistSyncSchema = z.object({
  gistId: z.string().optional(),
  token: z.string().optional()
})

export const WebDavSyncSchema = z.object({
  url: z.string().url().optional(),
  username: z.string().optional(),
  password: z.string().optional()
})

export const ConfigSchema = z.object({
  version: z.number().int().nonnegative().default(STORAGE_VERSION),
  general: z
    .object({
      language: LanguageSchema.default("en"),
      theme: ThemeSchema.default("system"),
      defaultModelId: z.string().default("openai:gpt-4o-mini"),
      attachPageContent: z.boolean().default(true),
      systemPrompt: z.string().default(""),
      sidebarHeight: z.number().int().min(240).max(960).default(360)
    })
    .default({}),
  extraction: z
    .object({
      defaultMode: ExtractionModeSchema.default("readability"),
      jinaApiKey: z.string().optional()
    })
    .default({}),
  sync: z
    .object({
      provider: SyncProviderSchema.default("none"),
      saveOnChange: z.boolean().default(false),
      gist: GistSyncSchema.default({}),
      webdav: WebDavSyncSchema.default({}),
      lastSyncedAt: z.number().nullable().default(null)
    })
    .default({}),
  blacklist: z.array(z.string()).default([
    "https://mail.google.com/*",
    "https://docs.google.com/*"
  ]),
  shortcuts: z.array(ShortcutSchema).default([
    {
      id: "chat",
      label: "Chat",
      prompt: "",
      autoTrigger: false,
      modelIds: []
    }
  ]),
  models: z
    .array(LanguageModelSchema)
    .default([
      {
        id: "openai:gpt-4o-mini",
        label: "GPT-4o mini",
        provider: "openai",
        model: "gpt-4o-mini",
        apiKey: "",
        endpoint: undefined,
        deploymentId: undefined,
        supportsImages: true,
        streaming: true,
        disabled: false
      },
      {
        id: "gemini:flash",
        label: "Gemini Flash",
        provider: "gemini",
        model: "gemini-1.5-flash",
        apiKey: "",
        endpoint: undefined,
        deploymentId: undefined,
        supportsImages: true,
        streaming: true,
        disabled: false
      }
    ])
})

export type Config = z.infer<typeof ConfigSchema>
export type LanguageModel = z.infer<typeof LanguageModelSchema>

export const getDefaultConfig = (): Config => ConfigSchema.parse({})
