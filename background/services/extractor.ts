import type { ExtractionMode } from "../../lib/storage/schema"
import type { ExtractionResult } from "../../lib/extraction/types"
import { ExtractionResultSchema } from "../../lib/extraction/types"

const MESSAGE_TYPE = "thinkbot.extract.request"

export interface ExtractionOptions {
  mode?: ExtractionMode
  tabId?: number
}

export interface ExtractionResponse {
  tabId: number
  result: ExtractionResult
}

export class ExtractionService {
  constructor(private readonly defaultMode: ExtractionMode = "readability") {}

  async extractActivePage(options: ExtractionOptions = {}): Promise<ExtractionResponse> {
    if (typeof chrome === "undefined" || !chrome.tabs?.sendMessage) {
      throw new Error("chrome.tabs is not available")
    }

    const tabId =
      options.tabId ??
      (await this.resolveActiveTabId().catch((error) => {
        console.error("[extractor] failed to resolve active tab", error)
        throw error
      }))

    const mode = options.mode ?? this.defaultMode

    const response = await this.sendExtractionRequest(tabId, mode)

    return {
      tabId,
      result: ExtractionResultSchema.parse(response)
    }
  }

  private async resolveActiveTabId(): Promise<number> {
    if (!chrome.tabs?.query) {
      throw new Error("chrome.tabs query unavailable")
    }

    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })

    if (!activeTab?.id) {
      throw new Error("Active tab not found")
    }

    return activeTab.id
  }

  private async sendExtractionRequest(
    tabId: number,
    mode: ExtractionMode
  ): Promise<ExtractionResult> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        { type: MESSAGE_TYPE, mode },
        (response: ExtractionResult) => {
          const lastError = chrome.runtime.lastError

          if (lastError) {
            reject(new Error(lastError.message))
            return
          }

          if (!response) {
            reject(new Error("Empty extraction response"))
            return
          }

          resolve(response)
        }
      )
    })
  }
}

export const createExtractionService = () => new ExtractionService()
