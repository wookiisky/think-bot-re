import type { LLMProvider, LLMRequest } from "../index"
import type { LanguageModel } from "~lib/storage/schema"

export const createDeterministicProvider = (model: LanguageModel): LLMProvider => {
  return {
    id: model.provider,
    async *createStream(request: LLMRequest): AsyncGenerator<string> {
      const banner = `Model ${model.label} (${model.provider}) response\n`
      const contextSnippet = request.context
        ? `\nContext snippet:\n${request.context.slice(0, 400)}\n`
        : ""
      const historySnippet = request.history?.length
        ? `\nHistory:\n${request.history
            .slice(-4)
            .map((item) => `${item.role}> ${item.content.slice(0, 160)}`)
            .join("\n")}\n`
        : ""
      const systemSegment = request.systemPrompt
        ? `\nSystem prompt: ${request.systemPrompt}\n`
        : ""
      const body = request.prompt.trim().length
        ? request.prompt.trim()
        : "(empty message)"

      const response = `${banner}${body}${contextSnippet}${historySnippet}${systemSegment}\n-- End of deterministic draft --`

      const parts = response.split(/(\s+)/)

      for (const part of parts) {
        if (!part) {
          continue
        }

        yield part
      }
    }
  }
}
