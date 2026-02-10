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

export const toMessageAttachmentUI = (doc, getHttpUrlForRemote = defaultGetHttpUrlForRemote) => {
  const img = isImageDoc(doc)
  const httpUrl = getHttpUrlForRemote(doc)

  return {
    id: doc.documentId || doc.id,
    documentId: doc.documentId || doc.id,
    name: doc.title || 'file',
    kind: img ? 'image' : 'file',
    // not a mimeType – but you show it as a “type label”
    mimeType: doc.fileType?.name || null,
    previewUrl: img ? httpUrl : null,
    url: httpUrl,          // useful for click/open
    remoteUrl: doc.remoteUrl,
    externalUrl: doc.externalUrl
  }
}