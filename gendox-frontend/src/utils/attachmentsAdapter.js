const imageExt = /\.(png|jpe?g|gif|webp|bmp|svg)$/i

const isImageDoc = doc => {
  const name = (doc?.title || doc?.name || '').toLowerCase()
  const ft = (doc?.fileType?.name || '').toUpperCase()

  if (ft.includes('IMAGE')) return true
  if (imageExt.test(name)) return true

  // fallback: remoteUrl can also hint if it's an image (for attachments that come from messages metadata endpoint, which don't have fileType or title)
  const remote = (doc?.remoteUrl || '').toLowerCase()
  return imageExt.test(remote)
}

const defaultGetHttpUrlForRemote = doc => {
  // 1) prefer externalUrl if it exists (ideal)
  if (doc?.externalUrl) return doc.externalUrl

  // 2) if remoteUrl is already http(s)
  if (doc?.remoteUrl?.startsWith('http://') || doc?.remoteUrl?.startsWith('https://')) return doc.remoteUrl

  // 3) otherwise you can't show it in the browser (file:/ or s3://)
  return null
}

export const toMessageAttachmentUI = (a) => {
  const title = a.title || a.name || 'attachment'
  const mimeType = a.mimeType || a.fileType?.name || ''
  const lower = title.toLowerCase()

  const ext = getExtFromRemoteUrl(a.remoteUrl)
  const documentType = ext ? ext.toUpperCase() : 'FILE'

  const isImage =
    mimeType.toLowerCase().includes('image') ||
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.gif') ||
    lower.endsWith('.webp')

  return {
    id: a.documentId || a.id,              
    documentId: a.documentId,
    title,
    mimeType,
    kind: isImage ? 'image' : 'file',
    documentType,
    previewUrl: a.previewUrl || null,
    previewStatus: a.previewStatus || (a.previewUrl ? 'ready' : 'idle')
  }
}

const getExtFromRemoteUrl = (remoteUrl) => {
  if (!remoteUrl) return null

  // remove query/hash if ever exists
  const clean = remoteUrl.split('?')[0].split('#')[0]

  // get last path segment
  const fileName = clean.split('/').pop() || ''

  // extract ext
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex === -1) return null

  return fileName.slice(dotIndex + 1).toLowerCase()
}
