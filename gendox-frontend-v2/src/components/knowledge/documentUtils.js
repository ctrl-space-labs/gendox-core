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
export const authorOf = (document, members) =>
  members?.find(member => member.user?.id === document?.createdBy)?.user?.name || ''

// the list (DocumentInstanceDTO) says createAt / updateAt; a single document (GET documents/{id}) says createdAt / updatedAt
export const createdAtOf = document => document?.createdAt ?? document?.createAt
export const updatedAtOf = document => document?.updatedAt ?? document?.updateAt

export const plural = (count, word) => `${count} ${count === 1 ? word : word + 's'}`
