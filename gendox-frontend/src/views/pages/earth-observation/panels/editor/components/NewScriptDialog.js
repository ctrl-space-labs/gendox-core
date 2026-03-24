import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

export default function NewScriptDialog({
  open,
  onClose,
  newScriptNameInput,
  setNewScriptNameInput,
  onCreateNewScript
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>New Script</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label='Script name'
          value={newScriptNameInput}
          onChange={e => setNewScriptNameInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && newScriptNameInput.trim()) onCreateNewScript()
          }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={onCreateNewScript} disabled={!newScriptNameInput.trim()}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}
