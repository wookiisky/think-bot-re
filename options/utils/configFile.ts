import type { Config } from "../../lib/storage/schema"
import { ConfigSchema } from "../../lib/storage/schema"

export const parseConfigFile = async (file: File): Promise<Config> => {
  const text = await file.text()
  const parsed = JSON.parse(text)
  return ConfigSchema.parse(parsed)
}

export const downloadConfigFile = (config: Config) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: "application/json"
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `think-bot-config-${timestamp}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
