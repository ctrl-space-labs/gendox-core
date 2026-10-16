import { Check, ChevronDown, FileCode, Plus } from 'lucide-react'
import Menu from 'src/components/ui/Menu'
import { fmtRelative } from '../utils/editorDateUtils'

/** The script being edited, and the task's other scripts */
export default function ScriptSelectorMenu({
  currentScriptName,
  hasUnsavedChanges,
  distinctScripts,
  isFirstScript,
  onSelectScript,
  onOpenNewScriptDialog
}) {
  return (
    <Menu
      width={240}
      trigger={({ onClick }) => (
        <button className='btn ghost s' title='Switch script' onClick={onClick} style={{ maxWidth: 220 }}>
          <FileCode className='lucide' />
          <span className='trunc'>{currentScriptName}</span>
          {hasUnsavedChanges && (
            <span title='Unsaved changes' style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warn)', flex: 'none' }} />
          )}
          <ChevronDown className='lucide' />
        </button>
      )}
    >
      <div className='h'>Scripts</div>
      {distinctScripts.map(script => (
        <button key={script.id} className='mi tall' data-close-menu onClick={() => onSelectScript(script)}>
          <FileCode className='lucide' />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span className='trunc' style={{ display: 'block' }}>
              {script.title}
            </span>
            <span className='faint sm'>{fmtRelative(script.createdAt)}</span>
          </span>
          {script.title === currentScriptName && <Check className='lucide' />}
        </button>
      ))}
      {distinctScripts.length > 0 && <hr />}
      <button className='mi' data-close-menu onClick={onOpenNewScriptDialog} disabled={isFirstScript}>
        <Plus className='lucide' />
        New script…
      </button>
    </Menu>
  )
}
