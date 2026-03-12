// Sentinel used to mark that a tool edit is currently in flight.
// Set before executeEdits (which fires onChange synchronously) so onChange
// knows not to clear pending change state during a tool-driven edit.
export const TOOL_EDIT_IN_FLIGHT = {}

/**
 * Translates original-script line numbers to current-document line numbers using
 * previously applied patches. Each patch that ends before a given line adds its
 * delta (newLineCount - replacedLineCount) to that line's offset.
 */
export function translateOriginalLinesToCurrent(appliedPatches, startLine, endLine) {
  let startOffset = 0
  let endOffset = 0
  for (const p of appliedPatches) {
    const replacedCount = p.originalEnd - p.originalStart + 1
    const delta = p.newLineCount - replacedCount
    if (startLine > p.originalEnd) startOffset += delta
    if (endLine > p.originalEnd) endOffset += delta
  }
  return {
    translatedStart: startLine + startOffset,
    translatedEnd: endLine + endOffset
  }
}

/**
 * Returns the number of lines in the given text (for patch delta calculation).
 * Empty or null is treated as 1 line so the offset matches Monaco.
 */
export function getNewTextLineCount(text) {
  if (text == null || text === '') return 1
  const lines = String(text).split(/\r?\n/)
  return lines.length || 1
}

/**
 * Builds Monaco decoration descriptors for whole-line highlight of the given range.
 */
export function buildPatchLineDecorations(monaco, startLine, endLine) {
  const decorations = []
  for (let L = startLine; L <= endLine; L++) {
    decorations.push({
      range: new monaco.Range(L, 1, L, 1),
      options: {
        isWholeLine: true,
        className: 'gendox-patch-changed-line',
        stickiness: 1
      }
    })
  }
  return decorations
}
