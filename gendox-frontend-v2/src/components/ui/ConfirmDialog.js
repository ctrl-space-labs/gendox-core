import { useState } from 'react'
import Dialog from 'src/components/ui/Dialog'

/**
 * Asks before an action. When onConfirm returns a promise (a delete that calls the API), the dialog stays open
 * with the button busy until it settles, so the thing being removed doesn't sit in the list with no sign of it.
 */
const ConfirmDialog = ({ open, onClose, onConfirm, title, text, confirmLabel = 'Delete', danger = true }) => {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    const result = onConfirm()
    if (!result || typeof result.then !== 'function') return onClose()
    setBusy(true)
    try {
      await result
    } catch {
      // the caller reports its own errors
    } finally {
      setBusy(false)
      onClose()
    }
  }

  return (
    <Dialog
      busy={busy}
      open={open}
      onClose={onClose}
      title={title}
      size='s'
      footer={
        <>
          <button className='btn' onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button aria-busy={busy} className={`btn ${danger ? 'danger-solid' : 'primary'}`} onClick={confirm} disabled={busy}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className='muted' style={{ lineHeight: 1.6 }}>
        {text}
      </p>
    </Dialog>
  )
}

export default ConfirmDialog
