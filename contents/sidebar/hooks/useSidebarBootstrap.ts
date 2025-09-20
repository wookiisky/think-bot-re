import { useEffect } from "react"

import { useSidebarStore } from "../../../store/sidebar"

export const useSidebarBootstrap = () => {
  const setReady = useSidebarStore((state) => state.setReady)

  useEffect(() => {
    console.info("[sidebar] bootstrap hook")
    setReady(true)
  }, [setReady])
}
