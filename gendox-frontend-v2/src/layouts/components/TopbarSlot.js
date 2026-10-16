import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Renders its children at the start of the top bar, e.g. a page's own menu button on phones
const TopbarSlot = ({ children }) => {
  const [slot, setSlot] = useState(null)

  useEffect(() => {
    setSlot(document.getElementById('topbar-slot'))
  }, [])

  return slot ? createPortal(children, slot) : null
}

export default TopbarSlot
