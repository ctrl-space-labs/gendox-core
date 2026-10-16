import { useCallback, useEffect, useRef, useState } from 'react'

const read = key => {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key, value) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {}
}

/**
 * The split of a list and its inspector (Document insights, Digitization): the inspector's left edge can be dragged,
 * or it can take the whole width. Both are remembered per kind of page.
 * Put `ref` on the `.ins` element and `onPointerDown` on its `.ins-gut`.
 */
const useSplitPane = key => {
  const ref = useRef(null)
  const [full, setFull] = useState(false)
  const [resizing, setResizing] = useState(false)

  useEffect(() => {
    const left = read(`${key}-left`)
    if (left && ref.current) ref.current.style.setProperty('--left', left)
    setFull(read(`${key}-full`) === '1')
  }, [key])

  const onPointerDown = useCallback(
    e => {
      e.preventDefault()
      const box = ref.current.getBoundingClientRect()
      setResizing(true)
      const move = ev =>
        ref.current?.style.setProperty('--left', `${Math.min(Math.max(ev.clientX - box.left, 280), box.width - 440)}px`)
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        setResizing(false)
        write(`${key}-left`, ref.current?.style.getPropertyValue('--left') ?? '')
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },
    [key]
  )

  const toggleFull = useCallback(() => {
    setFull(f => {
      write(`${key}-full`, f ? '0' : '1')

      return !f
    })
  }, [key])

  return { ref, full, resizing, toggleFull, onPointerDown }
}

export default useSplitPane
