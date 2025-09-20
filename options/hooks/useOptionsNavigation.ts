import { useCallback, useState } from "react"

export const useOptionsNavigation = () => {
  const [active, setActive] = useState("general")

  const handleSelect = useCallback((next: string) => {
    console.info("[options] select section", next)
    setActive(next)
  }, [])

  return {
    active,
    handleSelect
  }
}
