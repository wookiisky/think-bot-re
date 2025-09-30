import { Storage } from "@plasmohq/storage"

import {
  type Config,
  ConfigSchema,
  STORAGE_VERSION,
  getDefaultConfig
} from "../../lib/storage/schema"
import {
  type ConversationCollection,
  ConversationCollectionSchema
} from "../../lib/conversation/schema"

const STORAGE_KEY = "thinkbot:snapshot:v1"

export interface StorageSnapshot {
  version: number
  config: Config
  conversations: ConversationCollection
}

export class StorageService {
  private storage: Storage

  constructor(private readonly key: string = STORAGE_KEY) {
    this.storage = new Storage()
    console.info("[storage] service ready")
  }

  async readSnapshot(): Promise<StorageSnapshot> {
    console.info("[storage] read snapshot")
    const existing = (await this.storage.get<StorageSnapshot | null>(
      this.key
    )) ?? null

    if (!existing) {
      return this.createDefaultSnapshot()
    }

    const config = ConfigSchema.parse(existing.config)
    const conversations = ConversationCollectionSchema.parse(
      existing.conversations ?? {}
    )

    if (existing.version !== STORAGE_VERSION) {
      console.info("[storage] migrating snapshot", existing.version)
      return {
        version: STORAGE_VERSION,
        config,
        conversations
      }
    }

    return {
      version: existing.version,
      config,
      conversations
    }
  }

  async writeSnapshot(snapshot: StorageSnapshot): Promise<void> {
    const serialisable: StorageSnapshot = {
      ...snapshot,
      version: STORAGE_VERSION
    }

    console.info("[storage] write snapshot", {
      version: serialisable.version,
      models: serialisable.config.models.length,
      conversations: Object.keys(serialisable.conversations).length
    })

    await this.storage.set(this.key, serialisable)
  }

  async updateConfig(config: Config): Promise<Config> {
    const snapshot = await this.readSnapshot()
    const next: StorageSnapshot = {
      ...snapshot,
      config: ConfigSchema.parse({ ...config, version: STORAGE_VERSION })
    }

    await this.writeSnapshot(next)

    return next.config
  }

  async updateConversations(
    conversations: ConversationCollection
  ): Promise<ConversationCollection> {
    const snapshot = await this.readSnapshot()
    const next: StorageSnapshot = {
      ...snapshot,
      conversations: ConversationCollectionSchema.parse(conversations)
    }

    await this.writeSnapshot(next)

    return next.conversations
  }

  private createDefaultSnapshot(): StorageSnapshot {
    const config = getDefaultConfig()

    return {
      version: STORAGE_VERSION,
      config,
      conversations: {}
    }
  }
}

export const createStorageService = () => new StorageService()
