import type { LLMProvider, LLMRequest } from "../index"

export const createBedrockProvider = (): LLMProvider => {
  console.info("[llm][bedrock] provider stub ready")

  return {
    id: "bedrock",
    send: async (request: LLMRequest) => {
      console.info("[llm][bedrock] mock send", request)
    }
  }
}
