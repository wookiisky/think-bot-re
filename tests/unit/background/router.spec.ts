import { afterEach, describe, expect, it, vi } from "vitest"

import { initMessageRouter } from "../../../background/router"
import { registerBackgroundHandlers } from "../../../lib/messaging/handlers"

vi.mock("../../../lib/messaging/handlers", () => ({
  registerBackgroundHandlers: vi.fn()
}))

describe("initMessageRouter", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("registers handlers and disposes them on cleanup", () => {
    const cleanup = vi.fn()
    vi.mocked(registerBackgroundHandlers).mockReturnValue(cleanup)

    const dispose = initMessageRouter()

    expect(registerBackgroundHandlers).toHaveBeenCalledTimes(1)

    dispose()

    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})
