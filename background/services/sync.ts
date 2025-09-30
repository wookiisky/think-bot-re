import type { StorageService } from "./storage"
import type { Config } from "../../lib/storage/schema"

export interface SyncResult {
  completedAt: number
  provider: Config["sync"]["provider"]
  bytes: number
  skipped: boolean
}

const encodeBase64 = (value: string) => {
  if (typeof btoa === "function") {
    const bytes = new TextEncoder().encode(value)
    let binary = ""
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte)
    })
    return btoa(binary)
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf-8").toString("base64")
  }

  throw new Error("No base64 encoder available")
}

export class SyncService {
  constructor(
    private readonly storage: StorageService,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async sync(): Promise<SyncResult> {
    const snapshot = await this.storage.readSnapshot()
    const { provider, gist, webdav } = snapshot.config.sync
    const payload = JSON.stringify({
      config: snapshot.config,
      conversations: snapshot.conversations
    })
    const bytes = new TextEncoder().encode(payload).length

    if (provider === "none") {
      console.info("[sync] provider disabled, skipping")
      return {
        completedAt: Date.now(),
        provider,
        bytes,
        skipped: true
      }
    }

    if (provider === "gist") {
      if (!gist.gistId || !gist.token) {
        throw new Error("gist credentials missing")
      }

      await this.fetchImpl(`https://api.github.com/gists/${gist.gistId}`, {
        method: "PATCH",
        headers: {
          Authorization: `token ${gist.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          files: {
            "thinkbot-sync.json": {
              content: payload
            }
          }
        })
      })
    }

    if (provider === "webdav") {
      if (!webdav.url) {
        throw new Error("webdav url missing")
      }

      const auth =
        webdav.username || webdav.password
          ? `Basic ${encodeBase64(`${webdav.username ?? ""}:${webdav.password ?? ""}`)}`
          : undefined

      await this.fetchImpl(webdav.url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(auth ? { Authorization: auth } : {})
        },
        body: payload
      })
    }

    const completedAt = Date.now()

    await this.storage.updateConfig({
      ...snapshot.config,
      sync: {
        ...snapshot.config.sync,
        lastSyncedAt: completedAt
      }
    })

    return {
      completedAt,
      provider,
      bytes,
      skipped: false
    }
  }
}

export const createSyncService = (storage: StorageService) =>
  new SyncService(storage)
