import { CircleDot } from 'lucide-react'

/**
 * The sticky bar at the bottom of a settings form while it has unsaved changes.
 */
const SaveBar = ({ visible, isSaving, onDiscard, onSave, saveLabel = 'Save changes' }) => {
  if (!visible) return null

  return (
    <div className='save-bar'>
      <CircleDot className='lucide' style={{ color: 'var(--warn)' }} />
      <span style={{ flex: 1 }}>Unsaved changes</span>
      <button className='btn ghost' onClick={onDiscard} disabled={isSaving}>
        Discard
      </button>
      <button aria-busy={isSaving} className='btn primary' onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Saving…' : saveLabel}
      </button>
    </div>
  )
}

export default SaveBar
