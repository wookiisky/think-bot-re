import { AzureOpenAI } from "@azure/openai"

import type { LLMProvider, LLMRequest } from "../index"
import { createDeterministicProvider } from "./deterministic"
import type { LanguageModel } from "~lib/storage/schema"

const buildMessages = (request: LLMRequest) => {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = []

  if (request.systemPrompt) {
    messages.push({ role: "system", content: request.systemPrompt })
  }

  request.history?.forEach((message) => {
    if (message.role === "system" || message.role === "user" || message.role === "assistant") {
      messages.push({ role: message.role, content: message.content })
    }
  })

  messages.push({ role: "user", content: request.prompt })
  return messages
}

export const createAzureProvider = (model: LanguageModel): LLMProvider => {
  if (!model.apiKey || !model.endpoint || !model.deploymentId) {
    return createDeterministicProvider(model)
  }

  const client = new AzureOpenAI({
    apiKey: model.apiKey,
    endpoint: model.endpoint
  })

  return {
    id: "azure",
    async *createStream(request: LLMRequest): AsyncGenerator<string> {
      const stream = await client.chat.completions.create({
        deployment: model.deploymentId,
        messages: buildMessages(request),
        stream: true
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content

        if (content) {
          yield content
        }
      }
    }
  }
}
