export interface ExtractionResult {
  title: string
  content: string
  source: "placeholder"
}

export class ExtractionService {
  async extractActivePage(): Promise<ExtractionResult> {
    console.info("[extractor] run placeholder extraction")
    return {
      title: "placeholder title",
      content: "placeholder content",
      source: "placeholder"
    }
  }
}

export const createExtractionService = () => new ExtractionService()
