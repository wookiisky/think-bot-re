const FALLBACK_DICTIONARY: Record<string, string> = {
  "app.title": "Think Bot RE",
  "app.ready": "Ready"
}

export const loadDictionary = async (language: string) => {
  console.info("[i18n] load dictionary", language)

  return FALLBACK_DICTIONARY
}
