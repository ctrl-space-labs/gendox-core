import { Check, Cloud, LoaderCircle, Save, Sparkles } from 'lucide-react'

/** The assistant's pending change (Keep all / Undo all), and Save, which makes a new version */
export default function SaveActions({ createEOScriptLoading, hasUnsavedChanges, hasPendingChange, onSave, onKeepAll, onUndoAll }) {
  return (
    <>
      {hasPendingChange && (
        <>
          <span className='badge accent hide-sm'>
            <Sparkles className='lucide' />
            Assistant’s change
          </span>
          <button className='btn s' onClick={onUndoAll} title='Go back to the script before this change'>
            Undo all
          </button>
          <button className='btn s' onClick={onKeepAll} style={{ color: 'var(--ok)' }} title='Keep the change'>
            <Check className='lucide' />
            Keep all
          </button>
        </>
      )}
      <button
        className='btn ghost s icon'
        onClick={onSave}
        disabled={createEOScriptLoading || !hasUnsavedChanges}
        title={createEOScriptLoading ? 'Saving…' : hasUnsavedChanges ? 'Save as a new version' : 'Saved'}
      >
        {createEOScriptLoading ? (
          <LoaderCircle className='lucide turning' />
        ) : hasUnsavedChanges ? (
          <Save className='lucide' />
        ) : (
          <Cloud className='lucide' />
        )}
      </button>
    </>
  )
}
