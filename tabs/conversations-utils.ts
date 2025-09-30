import type { Conversation } from "../lib/conversation/schema"

export const sortConversations = (items: Conversation[]): Conversation[] => {
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt)
}

export const upsertConversation = (
  items: Conversation[],
  conversation: Conversation
): Conversation[] => {
  const filtered = items.filter((item) => item.id !== conversation.id)
  return sortConversations([conversation, ...filtered])
}
