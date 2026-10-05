import { useEffect, useRef, useState } from 'react'
import { copyToClipboard } from 'src/utils/copyToClipboard'

/**
 * The short "Copied" confirmation that follows a copy, held for a moment and
 * then cleared. The copying itself is `copyToClipboard`; this only owns the
 * state that tells the reader it worked.
 */
const useCopy = (holdMs = 1600) => {
  const [copied, setCopied] = useState(null)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async (id, text) => {
    if (!(await copyToClipboard(text))) return false

    setCopied(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), holdMs)

    return true
  }

  return { copied, copy }
}

export default useCopy
