import { beforeEach, describe, expect, it, vi } from "vitest"

import { useOptionsStore } from "../../../store/options"
import { getDefaultConfig, type Config } from "../../../lib/storage/schema"
import { sendBackgroundMessage } from "../../../lib/messaging/client"

vi.mock("../../../lib/messaging/client", () => ({
  sendBackgroundMessage: vi.fn()
}))

describe("useOptionsStore", () => {
  const mockSend = vi.mocked(sendBackgroundMessage)

  const freshConfig = (): Config => {
    return JSON.parse(JSON.stringify(getDefaultConfig())) as Config
  }

  beforeEach(() => {
    vi.clearAllMocks()
    const base = freshConfig()
    useOptionsStore.setState({
      config: base,
      baseline: base,
      isDirty: false,
      isLoading: false,
      isSaving: false,
      error: undefined
    })
  })

  it("loads configuration snapshots and resets dirty state", async () => {
    const loaded = freshConfig()
    loaded.general.theme = "dark"
    mockSend.mockResolvedValueOnce({ success: true, data: loaded })

    await useOptionsStore.getState().load()

    const state = useOptionsStore.getState()
    expect(state.config).toEqual(loaded)
    expect(state.baseline).toEqual(loaded)
    expect(state.isDirty).toBe(false)
  })

  it("marks state as dirty when configuration changes", () => {
    const initial = freshConfig()
    useOptionsStore.setState({ config: initial, baseline: initial, isDirty: false })

    useOptionsStore
      .getState()
      .update((config) => ({
        ...config,
        general: { ...config.general, theme: "dark" }
      }))

    const state = useOptionsStore.getState()
    expect(state.isDirty).toBe(true)
  })

  it("saves configuration and clears dirty flag", async () => {
    const initial = freshConfig()
    const updated = {
      ...initial,
      general: { ...initial.general, theme: "dark" }
    }

    useOptionsStore.setState({ config: updated, baseline: initial, isDirty: true })
    mockSend.mockResolvedValueOnce({ success: true, data: updated })

    await useOptionsStore.getState().save()

    const state = useOptionsStore.getState()
    expect(mockSend).toHaveBeenCalledWith({ type: "config:set", payload: updated })
    expect(state.isDirty).toBe(false)
    expect(state.baseline).toEqual(updated)
  })

  it("applies imported configuration and keeps dirty flag until saved", () => {
    const baseline = freshConfig()
    const imported = {
      ...baseline,
      general: { ...baseline.general, defaultModelId: "gemini:flash" }
    }

    useOptionsStore.setState({ config: baseline, baseline, isDirty: false })

    useOptionsStore.getState().applyConfig(imported)

    const state = useOptionsStore.getState()
    expect(state.config).toEqual(imported)
    expect(state.isDirty).toBe(true)
    expect(state.baseline).toEqual(baseline)
  })

  it("preserves an enabled default model when reordering", () => {
    const config = freshConfig()
    const originalDefault = config.general.defaultModelId
    const [first, second] = config.models

    useOptionsStore.setState({ config, baseline: config, isDirty: false })

    useOptionsStore.getState().update((current) => ({
      ...current,
      models: [second, first]
    }))

    const state = useOptionsStore.getState()
    expect(state.config.models[0]).toEqual(second)
    expect(state.config.general.defaultModelId).toBe(originalDefault)
    expect(state.isDirty).toBe(true)
  })

  it("switches default model when the previous default becomes disabled", () => {
    const config = freshConfig()
    const [first, second] = config.models

    useOptionsStore.setState({ config, baseline: config, isDirty: false })

    useOptionsStore.getState().update((current) => ({
      ...current,
      models: [
        { ...first, disabled: true },
        second
      ]
    }))

    const state = useOptionsStore.getState()
    expect(state.config.general.defaultModelId).toBe(second.id)
  })
})
