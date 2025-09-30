import type { ConversationMessage } from "~lib/conversation/schema"
import type { LanguageModel } from "~lib/storage/schema"

import { createDeterministicProvider } from "./providers/deterministic"
import {
  createOpenAIProvider,
  createGeminiProvider,
  createAzureProvider,
  createBedrockProvider
} from "./providers"

export interface LLMRequest {
  model: string
  prompt: string
  systemPrompt?: string
  context?: string | null
  history?: ConversationMessage[]
}

export interface LLMProvider {
  id: LanguageModel["provider"]
  createStream: (request: LLMRequest) => AsyncGenerator<string>
}

export const createLLMProvider = (model: LanguageModel): LLMProvider => {
  try {
    switch (model.provider) {
      case "openai":
        return createOpenAIProvider(model)
      case "gemini":
        return createGeminiProvider(model)
      case "azure":
        return createAzureProvider(model)
      case "bedrock":
        return createBedrockProvider(model)
      default:
        return createDeterministicProvider(model)
    }
  } catch (error) {
    console.warn("[llm] provider creation failed, falling back to deterministic", error)
    return createDeterministicProvider(model)
  }
}

export const runLLMStream = async (
  provider: LLMProvider,
  request: LLMRequest,
  onChunk: (chunk: string) => void
): Promise<string> => {
  let buffer = ""

  for await (const chunk of provider.createStream(request)) {
    buffer += chunk
    onChunk(chunk)
  }

  return buffer
}
