import type { LLMProvider, LLMRequest } from "../index"

export const createOpenAIProvider = (): LLMProvider => {
  console.info("[llm][openai] provider stub ready")

  return {
    id: "openai",
    send: async (request: LLMRequest) => {
      console.info("[llm][openai] mock send", request)
    }
  }
}
