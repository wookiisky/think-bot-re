export type BackgroundHandler = () => void

export const registerBackgroundHandlers = (): (() => void) => {
  console.info("[messaging] register background handlers")
  const handlers: BackgroundHandler[] = []

  return () => {
    handlers.forEach((handler) => handler())
    console.info("[messaging] dispose background handlers")
  }
}
