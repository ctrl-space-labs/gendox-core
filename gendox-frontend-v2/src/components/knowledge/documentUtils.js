// Helpers for knowledge documents (DocumentInstance).

// the stored file's name, e.g. "returns-policy.md"; the title has no extension
export const fileNameOf = document => {
  const path = (document?.remoteUrl || '').split('?')[0]
  const name = decodeURIComponent(path.split('/').pop() || '')

  return name || document?.title || ''
}

export const extensionOf = document => {
  const name = fileNameOf(document)

  return name.includes('.') ? name.split('.').pop().toLowerCase() : ''
}

const typeNames = {
  pdf: 'PDF',
  doc: 'Word',
  docx: 'Word',
  xls: 'Excel',
  xlsx: 'Excel',
  csv: 'CSV',
  txt: 'Text',
  md: 'Markdown',
  rst: 'Text'
}

// where a document came from: a website page, a WordPress post, or a file
export const sourceOf = document => {
  if (document?.fileType?.name === 'API_INTEGRATION_FILE') return 'WordPress'
  if (document?.externalUrl) return 'Website'

  return 'Uploaded'
}

export const typeNameOf = document => {
  if (document?.fileType?.name === 'API_INTEGRATION_FILE') return 'WordPress post'
  if (document?.externalUrl) return 'Web page'

  return typeNames[extensionOf(document)] || 'File'
}

// the tile's type for FileTile: web pages get the globe
export const tileTypeOf = document => (document?.externalUrl ? 'web' : undefined)

export const formatDate = value =>
  value ? new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''

/**
 * How long ago, the way a list of recent things reads: "Just now", "4m ago", "2h ago", "Yesterday", "3d ago",
 * "1w ago", then the date. Pair it with the full date in a title, see formatDateTime.
 */
export const timeAgo = (value, now = new Date()) => {
  if (!value) return ''
  const date = new Date(value)
  const minutes = Math.floor((now - date) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (date >= startOfToday) return `${hours}h ago`
  if (date >= new Date(startOfToday - 86400000)) return 'Yesterday'
  const days = Math.floor((startOfToday - date) / 86400000) + 1
  if (days < 7) return `${days}d ago`
  if (days < 35) return `${Math.floor(days / 7)}w ago`

  return formatDate(value)
}

export const formatDateTime = value =>
  value
    ? new Date(value).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : ''

export const formatSize = bytes => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// the splitter names untitled sections "Default Title"
export const sectionTitleOf = section => {
  const title = section?.documentSectionMetadata?.title

  return !title || title === 'Default Title' ? null : title
}

export const sortSections = sections =>
  [...(sections || [])].sort(
    (a, b) => (a.documentSectionMetadata?.sectionOrder ?? 0) - (b.documentSectionMetadata?.sectionOrder ?? 0)
  )

// the author's name from the agent's members, or nothing
// the person who added it, looked up in each list given ({ user } entries: the agent's members, then the organization's)
export const authorOf = (document, ...memberLists) => {
  if (!document?.createdBy) return ''
  for (const members of memberLists) {
    const name = members?.find(member => member.user?.id === document.createdBy)?.user?.name
    if (name) return name
  }

  return ''
}

// who or what added it: the person, else the site it was read from, else WordPress
export const addedByOf = (document, ...memberLists) => {
  const author = authorOf(document, ...memberLists)
  if (author) return author
  if (document?.externalUrl) {
    try {
      return new URL(document.externalUrl).hostname.replace(/^www\./, '')
    } catch {
      return ''
    }
  }
  if (document?.fileType?.name === 'API_INTEGRATION_FILE') return 'WordPress'

  return ''
}

// the list (DocumentInstanceDTO) says createAt / updateAt; a single document (GET documents/{id}) says createdAt / updatedAt
export const createdAtOf = document => document?.createdAt ?? document?.createAt
export const updatedAtOf = document => document?.updatedAt ?? document?.updateAt

export const plural = (count, word) => `${count} ${count === 1 ? word : word + 's'}`
