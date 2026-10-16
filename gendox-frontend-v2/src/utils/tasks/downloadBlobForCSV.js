/**
 * Triggers a download of a Blob as a file
 * @param {Blob|Uint8Array} blob - The data to save (usually Blob)
 * @param {string} fileName - The name for the downloaded file
 */

export function downloadBlobForCSV(blob, fileName) {
  const url = window.URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}