import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand
} from "@aws-sdk/client-bedrock-runtime"

import type { LLMProvider, LLMRequest } from "../index"
import { createDeterministicProvider } from "./deterministic"
import type { LanguageModel } from "~lib/storage/schema"

export const createBedrockProvider = (model: LanguageModel): LLMProvider => {
  if (!model.deploymentId) {
    return createDeterministicProvider(model)
  }

  const client = new BedrockRuntimeClient({ region: model.deploymentId })

  return {
    id: "bedrock",
    async *createStream(request: LLMRequest): AsyncGenerator<string> {
      const payload = {
        messages: [
          ...(request.systemPrompt
            ? [{ role: "system", content: [{ text: request.systemPrompt }] }]
            : []),
          ...(request.history?.map((message) => ({
            role: message.role,
            content: [{ text: message.content }]
          })) ?? []),
          { role: "user", content: [{ text: request.prompt }] }
        ]
      }

      const command = new InvokeModelWithResponseStreamCommand({
        modelId: model.model,
        contentType: "application/json",
        body: new TextEncoder().encode(JSON.stringify(payload))
      })

      const response = await client.send(command)

      for await (const event of response.body ?? []) {
        if (event.chunk?.bytes) {
          const text = new TextDecoder().decode(event.chunk.bytes)
          if (text) {
            yield text
          }
        }
      }
    }
  }
}
