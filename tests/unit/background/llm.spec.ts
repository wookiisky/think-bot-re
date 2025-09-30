import { beforeEach, describe, expect, it, vi } from "vitest"

import type { LanguageModel } from "../../../lib/storage/schema"

const providerMocks = vi.hoisted(() => {
  const deterministic = {
    id: "deterministic",
    createStream: vi.fn()
  }

  return {
    deterministic,
    createDeterministicProvider: vi.fn(() => deterministic),
    createOpenAIProvider: vi.fn((model: LanguageModel) => ({
      id: `${model.provider}:provider`,
      createStream: vi.fn()
    })),
    createGeminiProvider: vi.fn((model: LanguageModel) => ({
      id: `${model.provider}:provider`,
      createStream: vi.fn()
    })),
    createAzureProvider: vi.fn((model: LanguageModel) => ({
      id: `${model.provider}:provider`,
      createStream: vi.fn()
    })),
    createBedrockProvider: vi.fn((model: LanguageModel) => ({
      id: `${model.provider}:provider`,
      createStream: vi.fn()
    }))
  }
})

vi.mock("../../../background/services/llm/providers", () => ({
  createOpenAIProvider: providerMocks.createOpenAIProvider,
  createGeminiProvider: providerMocks.createGeminiProvider,
  createAzureProvider: providerMocks.createAzureProvider,
  createBedrockProvider: providerMocks.createBedrockProvider
}))

vi.mock("../../../background/services/llm/providers/deterministic", () => ({
  createDeterministicProvider: providerMocks.createDeterministicProvider
}))

type LLMModule = typeof import("../../../background/services/llm")
let createLLMProvider: LLMModule["createLLMProvider"]
let runLLMStream: LLMModule["runLLMStream"]

const baseModel: LanguageModel = {
  id: "openai:gpt-4o-mini",
  label: "GPT-4o mini",
  provider: "openai",
  model: "gpt-4o-mini",
  apiKey: "key",
  endpoint: undefined,
  deploymentId: undefined,
  supportsImages: true,
  streaming: true,
  disabled: false
}

beforeEach(async () => {
  vi.clearAllMocks()
  vi.resetModules()
  ;({ createLLMProvider, runLLMStream } = await import("../../../background/services/llm"))
})

describe("createLLMProvider", () => {
  it("returns provider implementation for the configured vendor", () => {
    const provider = createLLMProvider(baseModel)

    expect(provider.id).toBe("openai:provider")
  })

  it("falls back to deterministic provider when factory throws", () => {
    providerMocks.createOpenAIProvider.mockImplementationOnce(() => {
      throw new Error("boom")
    })

    const provider = createLLMProvider(baseModel)

    expect(provider).toBe(providerMocks.deterministic)
    expect(providerMocks.createDeterministicProvider).toHaveBeenCalledWith(baseModel)
  })
})

describe("runLLMStream", () => {
  it("aggregates streamed chunks and forwards each piece", async () => {
    const stream = async function* () {
      yield "Hello"
      yield ", "
      yield "world!"
    }

    const provider = {
      id: "openai",
      createStream: vi.fn().mockReturnValue(stream())
    }

    const onChunk = vi.fn()

    const result = await runLLMStream(provider, {
      model: "gpt-4o-mini",
      prompt: "Hello",
      history: [],
      context: null
    }, onChunk)

    expect(result).toBe("Hello, world!")
    expect(onChunk).toHaveBeenCalledTimes(3)
    expect(onChunk.mock.calls.map((call) => call[0])).toEqual(["Hello", ", ", "world!"])
  })
})
