import { createContext, useContext, useMemo, type ReactNode } from "react"

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
  const value = useMemo(() => {
    console.info("[i18n] activate language", language)

    return {
      language,
      t: (key: string) => key
    }
  }, [language])

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export const useTranslationContext = () => useContext(TranslationContext)
