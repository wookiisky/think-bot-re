import { initMessageRouter } from "./router"

const bootstrapBackground = () => {
  console.info("[background] bootstrap start")
  const dispose = initMessageRouter()

  self.addEventListener("beforeunload", () => {
    dispose()
  })

  self.addEventListener("unhandledrejection", (event) => {
    console.error("[background] unhandled rejection", event.reason)
  })

  console.info("[background] bootstrap completed")

  return dispose
}

bootstrapBackground()
