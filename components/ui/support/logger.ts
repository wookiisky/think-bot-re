import { createLogger } from "../../../lib/utils/logger"

export const createUiLogger = (scope: string) => {
  return createLogger(`[ui]${scope}`)
}
