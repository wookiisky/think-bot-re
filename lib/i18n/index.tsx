import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react"

import { loadDictionary } from "./loader"

interface TranslationValue {
  language: string
  t: (key: string) => string
}

const TranslationContext = createContext<TranslationValue>({
  language: "en",
  t: (key) => key
})

interface TranslationProviderProps {
  language: string
  children: ReactNode
}

export const TranslationProvider = ({ language, children }: TranslationProviderProps) => {
  const [dictionary, setDictionary] = useState<Record<string, string>>({})

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const messages = await loadDictionary(language)

      if (mounted) {
        setDictionary(messages)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [language])

  const value = useMemo(() => {
    return {
      language,
      t: (key: string) => dictionary[key] ?? key
    }
  }, [language, dictionary])

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export const useTranslationContext = () => useContext(TranslationContext)
