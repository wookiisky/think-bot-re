import { useMemo } from "react"

import { useOptionsStore } from "../store/options"

export const useLLMProvider = () => {
  const provider = useOptionsStore((state) => state.config.defaultProvider)

  return useMemo(() => provider, [provider])
}
