import { describe, expect, it } from "vitest"

import { getDefaultConfig } from "../../lib/storage/schema"

describe("getDefaultConfig", () => {
  it("returns default language", () => {
    expect(getDefaultConfig().general.language).toBe("en")
  })
})
