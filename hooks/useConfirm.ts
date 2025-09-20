import { useCallback } from "react"

export const useConfirm = () => {
  return useCallback(async (message: string) => {
    console.info("[confirm] prompt", message)
    return true
  }, [])
}
