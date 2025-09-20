export type LLMProviderId = "openai" | "gemini" | "azure" | "bedrock"

export interface LLMRequest {
  prompt: string
  stream?: boolean
}

export interface LLMProvider {
  id: LLMProviderId
  send: (request: LLMRequest) => Promise<void>
}

// createLLMProvider boots a stub provider based on identifier.
export const createLLMProvider = (providerId: LLMProviderId): LLMProvider => {
  console.info(`[llm] create provider: ${providerId}`)

  return {
    id: providerId,
    send: async (request) => {
      console.info(`[llm] send stub request via ${providerId}`, request)
    }
  }
}
