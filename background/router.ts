import { registerBackgroundHandlers } from "../lib/messaging/handlers"

export const initMessageRouter = () => {
  console.info("[background] router init")
  const cleanup = registerBackgroundHandlers()

  return () => {
    console.info("[background] router dispose")
    cleanup()
  }
}
