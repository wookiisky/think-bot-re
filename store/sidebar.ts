import { create } from "zustand"

interface SidebarState {
  isReady: boolean
  setReady: (ready: boolean) => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isReady: false,
  setReady: (ready) => {
    console.info("[store][sidebar] ready", ready)
    set({ isReady: ready })
  }
}))
