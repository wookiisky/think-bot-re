import { create } from "zustand"

import { sendBackgroundMessage } from "../lib/messaging/client"
import type { Config } from "../lib/storage/schema"
import { getDefaultConfig } from "../lib/storage/schema"

interface OptionsState {
  config: Config
  baseline: Config
  isLoading: boolean
  isSaving: boolean
  isDirty: boolean
  error?: string
  load: () => Promise<void>
  update: (updater: (config: Config) => Config) => void
  save: () => Promise<void>
  reset: () => Promise<void>
  applyConfig: (config: Config) => void
  setError: (error?: string) => void
}

export const useOptionsStore = create<OptionsState>((set, get) => ({
  config: getDefaultConfig(),
  baseline: getDefaultConfig(),
  isLoading: false,
  isSaving: false,
  isDirty: false,
  error: undefined,
  load: async () => {
    set({ isLoading: true, error: undefined })

    try {
      const response = await sendBackgroundMessage({
        type: "config:get",
        payload: undefined
      })

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to load config")
      }

      const next = ensureValidDefaultModel(response.data)

      set({
        config: next,
        baseline: next,
        isLoading: false,
        isDirty: false
      })
    } catch (error) {
      console.error("[store][options] load failed", error)
      set({
        isLoading: false,
        error: (error as Error).message
      })
    }
  },
  update: (updater) => {
    const current = get().config
    const next = ensureValidDefaultModel(updater(current))
    const baseline = get().baseline
    set({ config: next, isDirty: hasConfigChanged(next, baseline) })
  },
  save: async () => {
    const { config } = get()
    const configToPersist = ensureValidDefaultModel(config)
    set({ isSaving: true, error: undefined })

    try {
      const response = await sendBackgroundMessage({
        type: "config:set",
        payload: configToPersist
      })

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to save config")
      }

      const next = ensureValidDefaultModel(response.data)

      set({
        config: next,
        baseline: next,
        isSaving: false,
        isDirty: false
      })
    } catch (error) {
      console.error("[store][options] save failed", error)
      set({
        isSaving: false,
        error: (error as Error).message
      })
    }
  },
  reset: async () => {
    set({ isSaving: true, error: undefined })

    try {
      const response = await sendBackgroundMessage({
        type: "config:reset",
        payload: undefined
      })

      if (!response.success || !response.data) {
        throw new Error(response.error ?? "Failed to reset config")
      }

      const next = ensureValidDefaultModel(response.data)

      set({
        config: next,
        baseline: next,
        isSaving: false,
        isDirty: false
      })
    } catch (error) {
      console.error("[store][options] reset failed", error)
      set({
        isSaving: false,
        error: (error as Error).message
      })
    }
  },
  applyConfig: (config) => {
    const baseline = get().baseline
    const next = ensureValidDefaultModel(config)
    set({ config: next, isDirty: hasConfigChanged(next, baseline) })
  },
  setError: (error) => {
    set({ error })
  }
}))

const hasConfigChanged = (next: Config, baseline: Config): boolean => {
  return JSON.stringify(next) !== JSON.stringify(baseline)
}

const ensureValidDefaultModel = (config: Config): Config => {
  const currentDefault = config.models.find(
    (model) => model.id === config.general.defaultModelId && !model.disabled
  )

  if (currentDefault) {
    return config
  }

  const fallback = config.models.find((model) => !model.disabled)?.id

  if (!fallback) {
    return config
  }

  return {
    ...config,
    general: {
      ...config.general,
      defaultModelId: fallback
    }
  }
}
