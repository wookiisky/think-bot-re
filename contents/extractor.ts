import { Readability } from "@mozilla/readability"

import type { ExtractionMode } from "../lib/storage/schema"
import type { ExtractionResult } from "../lib/extraction/types"

const resolveDocument = (): Document => {
  return document.cloneNode(true) as Document
}

const extractWithReadability = (): ExtractionResult => {
  const cloned = resolveDocument()
  const reader = new Readability(cloned)
  const result = reader.parse()

  if (!result) {
    return {
      title: document.title,
      content: document.body.innerText ?? "",
      source: "readability"
    }
  }

  return {
    title: result.title ?? document.title,
    content: (result.textContent ?? result.content ?? "").trim(),
    source: "readability"
  }
}

const extractWithJina = async (): Promise<ExtractionResult> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const response = await fetch(`https://r.jina.ai/${location.href}`, {
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`jina request failed: ${response.status}`)
    }

    const text = await response.text()

    return {
      title: document.title,
      content: text.trim(),
      source: "jina"
    }
  } finally {
    clearTimeout(timeout)
  }
}

const runExtraction = async (mode: ExtractionMode): Promise<ExtractionResult> => {
  if (mode === "jina") {
    try {
      return await extractWithJina()
    } catch (error) {
      console.warn("[content-extractor] jina failed, falling back", error)
    }
  }

  return extractWithReadability()
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "thinkbot.extract.request") {
    return false
  }

  const mode = (message.mode as ExtractionMode | undefined) ?? "readability"

  void runExtraction(mode)
    .then((result) => {
      sendResponse(result)
    })
    .catch((error) => {
      console.error("[content-extractor] unexpected failure", error)
      const fallback = extractWithReadability()
      sendResponse({
        ...fallback,
        content: `${fallback.content}\n\n[extract-error] ${String(error)}`
      })
    })

  return true
})
