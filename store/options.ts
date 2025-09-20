import { create } from "zustand"

import { getDefaultConfig } from "../lib/storage/schema"
import type { Config } from "../lib/storage/schema"

interface OptionsState {
  config: Config
  setConfig: (next: Config) => void
}

export const useOptionsStore = create<OptionsState>((set) => ({
  config: getDefaultConfig(),
  setConfig: (next) => {
    console.info("[store][options] update config", next)
    set({ config: next })
  }
}))
