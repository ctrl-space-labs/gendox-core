import { Satellite } from 'lucide-react'

/** A task without a script yet: name the first one */
export default function FirstScriptOnboarding({ newScriptNameInput, setNewScriptNameInput, onCreateNewScript }) {
  return (
    <div className='eo-first'>
      <div className='stack' style={{ alignItems: 'center', maxWidth: 340 }}>
        <span className='avatar l' style={{ '--h': 205 }}>
          <Satellite className='lucide' />
        </span>
        <h3>Start your first script</h3>
        <p className='muted sm'>Give it a name. The assistant can write it with you.</p>
        <div className='row' style={{ width: '100%' }}>
          <input
            className='input'
            autoFocus
            aria-label='Script name'
            placeholder='e.g. NDVI analysis'
            value={newScriptNameInput}
            onChange={e => setNewScriptNameInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newScriptNameInput.trim()) onCreateNewScript()
            }}
            style={{ flex: 1 }}
          />
          <button className='btn primary' onClick={onCreateNewScript} disabled={!newScriptNameInput.trim()}>
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
