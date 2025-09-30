import { describe, expect, it } from "vitest"

import {
  ConfigSchema,
  getDefaultConfig,
  STORAGE_VERSION
} from "../../../lib/storage/schema"

describe("storage schema", () => {
  it("provides defaults with expected structure", () => {
    const config = getDefaultConfig()

    expect(config.version).toBe(STORAGE_VERSION)
    expect(config.general.language).toBe("en")
    expect(config.general.theme).toBe("system")
    expect(config.shortcuts.length).toBeGreaterThan(0)
    expect(config.models.length).toBeGreaterThan(0)
  })

  it("validates custom configuration", () => {
    const parsed = ConfigSchema.parse({
      version: STORAGE_VERSION,
      general: {
        language: "zh",
        theme: "dark",
        defaultModelId: "gemini:flash",
        attachPageContent: false,
        systemPrompt: "be kind",
        sidebarHeight: 420
      },
      extraction: {
        defaultMode: "jina",
        jinaApiKey: "test"
      },
      sync: {
        provider: "gist",
        saveOnChange: true,
        gist: {
          gistId: "123",
          token: "token"
        },
        webdav: {},
        lastSyncedAt: null
      },
      blacklist: ["https://example.com/*"],
      shortcuts: [
        {
          id: "chat",
          label: "Chat",
          prompt: "",
          autoTrigger: false,
          modelIds: []
        }
      ],
      models: [
        {
          id: "gemini:flash",
          label: "Gemini",
          provider: "gemini",
          model: "gemini-pro",
          apiKey: "",
          supportsImages: true,
          streaming: true,
          disabled: false
        }
      ]
    })

    expect(parsed.general.language).toBe("zh")
    expect(parsed.sync.provider).toBe("gist")
  })
})
