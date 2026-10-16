import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Renders its children in the top bar: at its start (e.g. a page's own menu button on phones),
 * or with at='end' just before Search (e.g. a workspace's Windows menu).
 */
const TopbarSlot = ({ at = 'start', children }) => {
  const [slot, setSlot] = useState(null)

  useEffect(() => {
    setSlot(document.getElementById(at === 'end' ? 'topbar-end' : 'topbar-slot'))
  }, [at])

  return slot ? createPortal(children, slot) : null
}

export default TopbarSlot
