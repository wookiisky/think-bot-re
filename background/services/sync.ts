export interface SyncPayload {
  timestamp: number
}

export class SyncService {
  async sync(): Promise<SyncPayload> {
    console.info("[sync] execute placeholder sync")

    return {
      timestamp: Date.now()
    }
  }
}

export const createSyncService = () => new SyncService()
