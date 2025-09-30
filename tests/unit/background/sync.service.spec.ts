import { afterEach, describe, expect, it, vi } from "vitest"

import { SyncService } from "../../../background/services/sync"
import { createStorageService } from "../../../background/services/storage"
import { getDefaultConfig } from "../../../lib/storage/schema"

vi.mock("@plasmohq/storage", () => {
  class MemoryStorage {
    store = new Map<string, unknown>()
    async get<T>(key: string): Promise<T | null> {
      return (this.store.get(key) as T) ?? null
    }
    async set(key: string, value: unknown) {
      this.store.set(key, value)
    }
  }

  return { Storage: MemoryStorage }
})

describe("SyncService", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("skips when provider disabled", async () => {
    const storage = createStorageService()
    await storage.updateConfig(getDefaultConfig())
    const service = new SyncService(storage, vi.fn())

    const result = await service.sync()

    expect(result.skipped).toBe(true)
  })

  it("invokes fetch for gist provider", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    const storage = createStorageService()
    const config = getDefaultConfig()

    await storage.updateConfig({
      ...config,
      sync: {
        ...config.sync,
        provider: "gist",
        gist: { gistId: "1", token: "token" }
      }
    })

    const service = new SyncService(storage, fetchMock)
    const result = await service.sync()

    expect(result.skipped).toBe(false)
    expect(fetchMock).toHaveBeenCalled()
  })
})
