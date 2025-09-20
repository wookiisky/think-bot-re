import type { LLMProvider, LLMRequest } from "../index"

export const createGeminiProvider = (): LLMProvider => {
  console.info("[llm][gemini] provider stub ready")

  return {
    id: "gemini",
    send: async (request: LLMRequest) => {
      console.info("[llm][gemini] mock send", request)
    }
  }
}
