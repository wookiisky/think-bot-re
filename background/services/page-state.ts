import type { ExtractionMode } from "../../lib/storage/schema"
import type {
  ExtractionStatus,
  PageExtractionState,
  PageState
} from "../../lib/page-state/schema"
import type { ExtractionResult } from "../../lib/extraction/types"

export class PageStateService {
  private readonly pages = new Map<number, PageState>()

  get(tabId: number): PageState | undefined {
    return this.pages.get(tabId)
  }

  ensure(tabId: number, mode: ExtractionMode): PageState {
    const existing = this.pages.get(tabId)

    if (existing) {
      return existing
    }

    const initial: PageState = {
      tabId,
      extraction: {
        status: "idle",
        mode
      }
    }

    this.pages.set(tabId, initial)
    return initial
  }

  setConversation(tabId: number, conversationId?: string): PageState | undefined {
    const state = this.pages.get(tabId)

    if (!state) {
      return undefined
    }

    const next: PageState = {
      ...state,
      conversationId
    }

    this.pages.set(tabId, next)
    return next
  }

  setExtraction(
    tabId: number,
    update: Partial<Omit<PageExtractionState, "mode">> & { mode?: ExtractionMode }
  ): PageState | undefined {
    const state = this.pages.get(tabId)

    if (!state) {
      return undefined
    }

    const nextExtraction: PageExtractionState = {
      ...state.extraction,
      ...update,
      mode: update.mode ?? state.extraction.mode
    }

    const next: PageState = {
      ...state,
      extraction: nextExtraction
    }

    this.pages.set(tabId, next)
    return next
  }

  clear(tabId: number): void {
    this.pages.delete(tabId)
  }

  clearAll(): void {
    this.pages.clear()
  }
}

export const createPageStateService = () => new PageStateService()
