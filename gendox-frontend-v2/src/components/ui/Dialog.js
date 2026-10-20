import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * A modal dialog.
 * @param size - 's' | 'm' | 'l'
 * @param footer - the buttons row
 * @param busy - its action is running: every field and button in it is disabled, and it can't be closed
 */
const Dialog = ({ open, onClose, title, subtitle, size = 'm', className = '', footer, busy = false, children }) => {
  const modalRef = useRef(null)
  const close = busy ? () => {} : onClose
  // read by the key handler, so it needn't be added again on every render
  const closeRef = useRef(close)
  closeRef.current = close

  useEffect(() => {
    if (!open) return
    const onKey = e => e.key === 'Escape' && closeRef.current()
    document.addEventListener('keydown', onKey)
    const focusTimer = setTimeout(() => {
      modalRef.current?.querySelector('input:not([type=checkbox]):not([type=radio]),textarea')?.focus()
    }, 30)

    return () => {
      document.removeEventListener('keydown', onKey)
      clearTimeout(focusTimer)
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className='modal-bg' onMouseDown={e => e.target === e.currentTarget && close()}>
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
          <button className='btn ghost s icon' onClick={close} disabled={busy} aria-label='Close'>
            <X />
          </button>
        </div>
        <fieldset className='lock' disabled={busy}>
          <div className='modal-b'>{children}</div>
          {footer && <div className='modal-f'>{footer}</div>}
        </fieldset>
      </div>
    </div>,
    document.body
  )
}

export default Dialog
