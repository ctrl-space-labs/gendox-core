import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * A modal dialog.
 * @param size - 's' | 'm' | 'l'
 * @param footer - the buttons row
 */
const Dialog = ({ open, onClose, title, subtitle, size = 'm', className = '', footer, children }) => {
  const modalRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const focusTimer = setTimeout(() => {
      modalRef.current?.querySelector('input:not([type=checkbox]):not([type=radio]),textarea')?.focus()
    }, 30)

    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(focusTimer)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className='modal-bg' onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size} ${className}`} role='dialog' aria-modal='true' ref={modalRef}>
        <div className='modal-h'>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle && (
              <p className='muted sm' style={{ marginTop: 4 }}>
                {subtitle}
              </p>
            )}
          </div>
          <button className='btn ghost s icon' onClick={onClose} aria-label='Close'>
            <X />
          </button>
        </div>
        <div className='modal-b'>{children}</div>
        {footer && <div className='modal-f'>{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

export default Dialog
