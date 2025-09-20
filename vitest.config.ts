import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.spec.ts"],
    exclude: ["tests/integration/**"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      lines: 0.8,
      functions: 0.8,
      statements: 0.8,
      branches: 0.8
    }
  }
})
