import { Storage } from "@plasmohq/storage"

export interface StorageSnapshot {
  version: number
}

export class StorageService {
  private storage: Storage

  constructor() {
    this.storage = new Storage()
    console.info("[storage] service ready")
  }

  async readSnapshot(): Promise<StorageSnapshot | null> {
    console.info("[storage] read snapshot")
    return null
  }

  async writeSnapshot(snapshot: StorageSnapshot): Promise<void> {
    console.info("[storage] write snapshot", snapshot)
    await this.storage.set("thinkbot:config:v1", snapshot)
  }
}

export const createStorageService = () => new StorageService()
