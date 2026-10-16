import Dialog from 'src/components/ui/Dialog'

export default function NewScriptDialog({ open, onClose, newScriptNameInput, setNewScriptNameInput, onCreateNewScript }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title='New script'
      size='s'
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button className='btn primary' onClick={onCreateNewScript} disabled={!newScriptNameInput.trim()}>
            Create
          </button>
        </>
      }
    >
      <div className='field'>
        <label htmlFor='eo-new-script'>Script name</label>
        <input
          id='eo-new-script'
          className='input'
          placeholder='e.g. NDVI analysis'
          value={newScriptNameInput}
          onChange={e => setNewScriptNameInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && newScriptNameInput.trim()) onCreateNewScript()
          }}
        />
      </div>
    </Dialog>
  )
}
