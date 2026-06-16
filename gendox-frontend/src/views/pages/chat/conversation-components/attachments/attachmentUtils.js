export const isImageFile = file => file?.type?.startsWith('image/')

export const getDocLabel = file => {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (file.type === 'application/pdf' || ext === 'pdf') return 'PDF'
  if (['txt', 'md', 'rst'].includes(ext)) return 'Document'
  if (['doc', 'docx'].includes(ext)) return 'Word'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Spreadsheet'
  return 'File'
}

export const formatBytes = bytes => {
  if (bytes == null) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export const withUniqueFileName = file => {
  const dotIndex = file.name.lastIndexOf('.')
  const baseName = dotIndex > 0 ? file.name.slice(0, dotIndex) : file.name
  const ext = dotIndex > 0 ? file.name.slice(dotIndex) : ''
  const name = `${baseName}-${crypto.randomUUID()}${ext}`
  return new File([file], name, { type: file.type, lastModified: file.lastModified })
}

export const createPasteHandler = (addFiles) => (e) => {
  const items = e.clipboardData?.items
  if (!items?.length) return

  const imageFiles = []

  for (const item of items) {
    if (item.kind === 'file' && item.type?.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) imageFiles.push(file)
    }
  }

  if (imageFiles.length > 0) {
    e.preventDefault()
    addFiles(imageFiles)
  }
}