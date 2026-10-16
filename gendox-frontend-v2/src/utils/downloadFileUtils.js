/**
 * Extract filename from Content-Disposition header
 */
export const getFilenameFromDisposition = disposition => {
  if (!disposition) return null

  // RFC5987: filename*=UTF-8''...
  const m5987 = disposition.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
  if (m5987?.[1]) {
    return decodeURIComponent(m5987[1].replace(/["']/g, ''))
  }

  // fallback: filename="..."
  const m = disposition.match(/filename\s*=\s*"?([^"]+)"?/i)
  return m?.[1] || null
}

export const forceDownloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'download'
  a.target = '_self'          // ✅ important
  a.rel = 'noopener'
  a.style.display = 'none'

  document.body.appendChild(a)
  a.click()

  // cleanup the URL object and remove the element
  setTimeout(() => {
    window.URL.revokeObjectURL(url)
    a.remove()
  }, 1000)
}

/**
 * Full helper: take axios response and trigger download
 */
export const downloadFromAxiosResponse = (response, fallbackName) => {
  const disposition = response?.headers?.['content-disposition']
  const filename = getFilenameFromDisposition(disposition) || fallbackName || 'download'

  const contentType = response?.headers?.['content-type'] || 'application/octet-stream'
  const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: contentType })

  forceDownloadBlob(blob, filename)
}
