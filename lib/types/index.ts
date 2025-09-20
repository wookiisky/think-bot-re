import type { Config } from "../storage/schema"

export type { Config }

export interface BackgroundRequest<TPayload = unknown> {
  type: string
  payload?: TPayload
}

export interface BackgroundResponse<TResult = unknown> {
  success: boolean
  result?: TResult
  error?: string
}

export type ProviderIdentifier = "openai" | "gemini" | "azure" | "bedrock"
