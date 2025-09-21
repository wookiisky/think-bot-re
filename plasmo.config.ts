import path from "path"
import { createRequire } from "module"
import { defineConfig, definePlasmoManifest } from "plasmo"

const require = createRequire(import.meta.url)
const vfileBase = path.dirname(require.resolve("vfile/package.json"))

export default defineConfig({
  manifest: {
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
  },
  vite: {
    resolve: {
      alias: {
        "#minpath": path.join(vfileBase, "lib/minpath.browser.js"),
        "#minproc": path.join(vfileBase, "lib/minproc.browser.js"),
        "#minurl": path.join(vfileBase, "lib/minurl.browser.js")
      }
    }
  }
})
