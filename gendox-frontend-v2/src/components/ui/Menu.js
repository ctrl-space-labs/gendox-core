import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * A popover menu. It renders on <body>, so a scrolling parent cannot clip it.
 *
 * @param trigger - ({ onClick, open }) => the button that opens it
 * @param children - the menu content, or (close) => content
 * @param align - 'left' | 'right' edge of the trigger
 * @param up - open above the trigger
 * @param width - minimum width in px
 *
 * A click on a `.mi` link or on `[data-close-menu]` closes the menu.
 */
const Menu = ({ trigger, children, align = 'left', up = false, width = 272 }) => {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const anchorRef = useRef(null)
  const popRef = useRef(null)

  const close = () => setOpen(false)

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return
    // the wrapper is display: contents and has no box of its own; measure the trigger itself
    const trigger = anchorRef.current.firstElementChild ?? anchorRef.current
    const r = trigger.getBoundingClientRect()
    const w = Math.max(r.width, width)
    const left = Math.max(8, Math.min(align === 'right' ? r.right - w : r.left, window.innerWidth - w - 8))
    setPosition(
      up ? { width: w, left, bottom: window.innerHeight - r.top + 6 } : { width: w, left, top: r.bottom + 6 }
    )
  }, [open, align, up, width])

  // a menu that would run past the bottom of the window opens above its trigger, when there is more room there
  useLayoutEffect(() => {
    if (!open || up || !position || position.bottom !== undefined || !popRef.current) return
    const trigger = anchorRef.current.firstElementChild ?? anchorRef.current
    const r = trigger.getBoundingClientRect()
    const height = popRef.current.offsetHeight
    if (r.bottom + 6 + height > window.innerHeight - 8 && r.top > window.innerHeight - r.bottom) {
      setPosition(p => ({ width: p.width, left: p.left, bottom: window.innerHeight - r.top + 6 }))
    }
  }, [open, up, position])

  useEffect(() => {
    if (!open) return
    const onPointerDown = e => {
      if (popRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return
      close()
    }
    const onKey = e => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const onPopClick = e => {
    if (e.target.closest('a.mi, [data-close-menu]')) close()
  }

  return (
    <>
      <span ref={anchorRef} style={{ display: 'contents' }}>
        {trigger({ onClick: () => setOpen(o => !o), open })}
      </span>
      {open &&
        position &&
        createPortal(
          <div className='pop' ref={popRef} style={position} onClick={onPopClick}>
            {typeof children === 'function' ? children(close) : children}
          </div>,
          document.body
        )}
    </>
  )
}

export default Menu
