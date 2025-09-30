import enUS from "../../locales/en_US.json" assert { type: "json" }
import zhCN from "../../locales/zh_CN.json" assert { type: "json" }

const FALLBACK_DICTIONARY: Record<string, string> = enUS

export const loadDictionary = async (language: string) => {
  console.info("[i18n] load dictionary", language)

  switch (language) {
    case "zh":
    case "zh-CN":
    case "zh_cn":
      return zhCN
    case "en":
    case "en-US":
    default:
      return enUS
  }
}
