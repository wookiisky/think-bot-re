export interface MessagingRequest<TPayload = unknown> {
  type: string
  payload?: TPayload
}

export interface MessagingResponse<TResult = unknown> {
  success: boolean
  result?: TResult
  error?: string
}

export const sendBackgroundMessage = async <TPayload, TResult>(
  request: MessagingRequest<TPayload>
): Promise<MessagingResponse<TResult>> => {
  console.info("[messaging] send placeholder message", request)
  return {
    success: true
  }
}
