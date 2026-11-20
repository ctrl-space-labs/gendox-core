// Links such as gendox://chat/<threadId>?organizationId=…&projectId=… open a conversation.
// External URLs can identify a conversation, never a server or arbitrary navigation target.
export function conversationFromLink(value, fallback = {}) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'gendox:' || url.hostname !== 'chat' || url.username || url.password || url.port || url.hash)
      return null
    const threadId = decodeURIComponent(url.pathname.slice(1))
    const organizationId = url.searchParams.get('organizationId') || fallback.organizationId
    const projectId = url.searchParams.get('projectId') || fallback.projectId
    const id = /^[a-zA-Z0-9-]{1,128}$/
    return [threadId, organizationId, projectId].every(value => typeof value === 'string' && id.test(value))
      ? { threadId, organizationId, projectId }
      : null
  } catch {
    return null
  }
}

/** The app route of a conversation: its agent home with the thread open. */
export function conversationPath({ organizationId, projectId, threadId }) {
  const query = new URLSearchParams()
  if (organizationId) query.set('organizationId', organizationId)
  if (projectId) query.set('projectId', projectId)
  return `/gendox/agent-home/?${query}#/chat/${encodeURIComponent(threadId)}`
}
