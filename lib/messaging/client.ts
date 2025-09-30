import type {
  MessagingEnvelope,
  MessagingRequestType,
  MessagingResponse
} from "./contracts"

export const sendBackgroundMessage = async <TType extends MessagingRequestType>(
  request: MessagingEnvelope<TType>
): Promise<MessagingResponse<TType>> => {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    throw new Error("chrome messaging is unavailable in this environment")
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(request, (response) => {
      const lastError = chrome.runtime.lastError

      if (lastError) {
        reject(new Error(lastError.message))
        return
      }

      resolve(response as MessagingResponse<TType>)
    })
  })
}
