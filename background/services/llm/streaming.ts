export interface StreamChunk {
  id: string
  data: string
}

export interface StreamingAssembler {
  push: (chunk: StreamChunk) => void
  complete: () => string
}

export const createStreamingAssembler = (): StreamingAssembler => {
  let buffer = ""

  return {
    push: (chunk) => {
      buffer += chunk.data
      console.info("[llm][stream] received chunk", chunk.id)
    },
    complete: () => {
      console.info("[llm][stream] complete")
      const result = buffer
      buffer = ""
      return result
    }
  }
}
