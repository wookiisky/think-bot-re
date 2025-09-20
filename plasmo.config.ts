import { defineConfig, definePlasmoManifest } from "plasmo"

export default defineConfig({
  runtimeManifest: definePlasmoManifest(() => ({
    name: "Think Bot RE",
    version: "0.1.0",
    manifest_version: 3,
    default_locale: "en",
    action: {
      default_title: "Think Bot RE"
    },
    background: {
      service_worker: "background/index.ts",
      type: "module"
    },
    options_ui: {
      page: "options/index.html",
      open_in_tab: true
    },
    side_panel: {
      default_path: "tabs/conversations.html"
    },
    permissions: ["storage", "tabs", "sidePanel", "scripting"],
    host_permissions: ["<all_urls>"],
    web_accessible_resources: [
      {
        resources: [
          "locales/en_US.json",
          "locales/zh_CN.json",
          "assets/fonts/*"
        ],
        matches: ["<all_urls>"]
      }
    ]
  }))
})
