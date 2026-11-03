export function downloadFile(url, filename = 'gee-map-result.png') {
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// true once the image is on the clipboard; the map shows the result beside its toolbar
export async function copyImageToClipboard(url) {
  if (!url) return false
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])

    return true
  } catch (err) {
    console.warn('Copy image failed:', err)

    return false
  }
}
