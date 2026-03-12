import toast from 'react-hot-toast'

export function downloadFile(url, filename = 'gee-map-result.png') {
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export async function copyImageToClipboard(url) {
  if (!url) return
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    toast.success('Image copied! You can now paste it anywhere.')
  } catch (err) {
    console.warn('Copy image failed:', err)
    toast.error('Copy failed — try Download instead.')
  }
}
