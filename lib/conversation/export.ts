import type { Conversation, ConversationMessage } from "./schema"

export interface ConversationExportOptions {
  includeMetadata?: boolean
}

const formatTimestamp = (value: number) => new Date(value).toISOString()

const renderMessage = (message: ConversationMessage) => {
  const headerParts = [message.role.toUpperCase()]

  if (message.modelId) {
    headerParts.push(`· ${message.modelId}`)
  }

  const header = `## ${headerParts.join(" ")}`

  const timestampLine = `_${formatTimestamp(message.createdAt)}_`

  const bodyLines = message.content ? message.content.trim().split(/\r?\n/) : []

  const attachmentLines = message.attachments.flatMap((attachment, index) => {
    if (attachment.type === "image") {
      return [`![attachment-${index + 1}](${attachment.dataUrl})`]
    }

    return []
  })

  return [header, timestampLine, "", ...bodyLines, ...attachmentLines, ""]
}

export const conversationToMarkdown = (
  conversation: Conversation,
  options: ConversationExportOptions = {}
): string => {
  const includeMetadata = options.includeMetadata !== false

  const lines: string[] = []

  if (includeMetadata) {
    lines.push(`# ${conversation.title || "Conversation"}`)

    if (conversation.url) {
      lines.push(`[Source](${conversation.url})`)
    }

    lines.push(`- Created: ${formatTimestamp(conversation.createdAt)}`)
    lines.push(`- Updated: ${formatTimestamp(conversation.updatedAt)}`)
    lines.push("")
  }

  conversation.messages.forEach((message) => {
    lines.push(...renderMessage(message))
  })

  return `${lines.join("\n").trim()}\n`
}
