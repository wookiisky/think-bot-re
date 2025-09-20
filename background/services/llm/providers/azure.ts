import type { LLMProvider, LLMRequest } from "../index"

export const createAzureProvider = (): LLMProvider => {
  console.info("[llm][azure] provider stub ready")

  return {
    id: "azure",
    send: async (request: LLMRequest) => {
      console.info("[llm][azure] mock send", request)
    }
  }
}
