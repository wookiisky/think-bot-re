import { GoogleGenerativeAI } from "@google/generative-ai"

import type { LLMProvider, LLMRequest } from "../index"
import { createDeterministicProvider } from "./deterministic"
import type { LanguageModel } from "~lib/storage/schema"

export const createGeminiProvider = (model: LanguageModel): LLMProvider => {
  if (!model.apiKey) {
    return createDeterministicProvider(model)
  }

  const client = new GoogleGenerativeAI(model.apiKey)
  const generativeModel = client.getGenerativeModel({ model: model.model })

  return {
    id: "gemini",
    async *createStream(request: LLMRequest): AsyncGenerator<string> {
      const systemParts = request.systemPrompt ? [{ text: request.systemPrompt }] : []
      const historyParts = request.history?.map((message) => ({
        role: message.role,
        parts: [{ text: message.content }]
      }))

      const contents = [
        ...systemParts.map((part) => ({ role: "user" as const, parts: [part] })),
        ...(historyParts ?? []),
        { role: "user" as const, parts: [{ text: request.prompt }] }
      ]

      const stream = await generativeModel.generateContentStream({ contents })

      for await (const chunk of stream.stream) {
        const text = chunk.text()

        if (text) {
          yield text
        }
      }
    }
  }
}
