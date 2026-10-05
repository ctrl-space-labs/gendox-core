/**
 * Copy text to the clipboard.
 *
 * Resolves false when the browser refuses: the clipboard needs a secure
 * context, so an http host that is not localhost will. Callers that show a
 * secret can reveal it instead, so a refusal never leaves the reader with
 * nothing.
 */
export const copyToClipboard = async text => {
  try {
    await navigator.clipboard.writeText(text)

    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)

    return false
  }
}
