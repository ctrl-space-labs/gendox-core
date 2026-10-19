// A message the signed-in user (or the anonymous visitor) wrote
export const isOwnMessage = (message, userId) => {
  if ((message.role || '').toLowerCase() === 'user') return true

  return message.createdBy === userId || message.createdBy === null
}

const hasContent = message => {
  const hasText = Boolean(message?.message && message.message.trim().length > 0)
  const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0
  const hasReasoning = Boolean(message?.reasoningContent && message.reasoningContent.trim().length > 0)

  return hasText || hasAttachments || hasReasoning
}

/**
 * Turn the raw message list of a thread into turns the UI can render directly:
 * a question, then everything the agent did to answer it.
 *
 *  • `{ type: 'answer', message }` — an assistant message with text or reasoning
 *  • `{ type: 'tools', header, responses }` — an assistant message that called tools, with the tools' replies
 *
 * The order of the messages is preserved.
 *
 * @param {Array<Object>} messages - `currentThread.messages`
 * @param {string} userId
 * @returns {Array<{ key: string, question: Object|null, items: Array<Object> }>}
 */
export const buildTurns = (messages = [], userId) => {
  const turns = []
  let openTools = null

  const currentTurn = () => {
    if (turns.length === 0) turns.push({ key: 'turn-0', question: null, items: [] })

    return turns[turns.length - 1]
  }
  const closeTools = () => {
    if (!openTools) return
    currentTurn().items.push(openTools)
    openTools = null
  }

  messages.forEach((message, index) => {
    const callsTools =
      message.role === 'assistant' && Array.isArray(message.toolCalls) && message.toolCalls.length > 0

    if (callsTools) {
      closeTools()
      if (message.message && message.message.trim() !== '') {
        currentTurn().items.push({ type: 'answer', message, beforeTools: true })
      }
      openTools = { type: 'tools', header: message, responses: [] }

      return
    }

    if (message.role === 'tool' && openTools) {
      openTools.responses.push(message)

      return
    }

    closeTools()
    if (!hasContent(message)) return

    if (isOwnMessage(message, userId)) {
      turns.push({ key: message.messageId || `turn-${index}`, question: message, items: [] })
    } else {
      currentTurn().items.push({ type: 'answer', message })
    }
  })
  closeTools()

  return turns
}

export const groupThreadsByDate = threads => {
  const groups = {
    Today: [],
    Yesterday: [],
    'Last 7 days': [],
    'Last 30 days': [],
    Older: []
  }

  const now = new Date()

  threads.forEach(thread => {
    const msgTime = new Date(thread.latestMessageCreatedAt)
    const diffDays = Math.floor((now - msgTime) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) groups.Today.push(thread)
    else if (diffDays === 1) groups.Yesterday.push(thread)
    else if (diffDays <= 7) groups['Last 7 days'].push(thread)
    else if (diffDays <= 30) groups['Last 30 days'].push(thread)
    else groups.Older.push(thread)
  })

  return groups
}

export const formatBytes = bytes => {
  if (bytes == null) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }

  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

// The pasted or dropped file keeps its name but can never collide with one already uploaded
export const withUniqueFileName = file => {
  const dotIndex = file.name.lastIndexOf('.')
  const baseName = dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name
  const ext = dotIndex > 0 ? file.name.slice(dotIndex) : ''
  const name = `${baseName}-${crypto.randomUUID()}${ext}`

  return new File([file], name, { type: file.type, lastModified: file.lastModified })
}

export const imageFilesFromPaste = event => {
  const items = event.clipboardData?.items
  if (!items?.length) return []

  const imageFiles = []
  for (const item of items) {
    if (item.kind === 'file' && item.type?.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) imageFiles.push(file)
    }
  }

  return imageFiles
}

// A short plain-text line from a Markdown message, for lists and previews
// (the API sends null for a thread with no message yet, which a default parameter would not catch)
export const toPlainPreview = text =>
  String(text ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~|]+/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

// "order-note-362d4343-f31e-4e5a-b6d1-da265542ed16.txt" → "order-note.txt": the suffix withUniqueFileName adds
export const displayFileName = name =>
  String(name ?? '').replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\.[^.]+$|$)/i, '')
