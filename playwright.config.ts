import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/integration",
  reporter: "list",
  timeout: 60000,
  use: {
    headless: true
  }
})
