import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material'

const AddEditQuestionDialog = ({ open, onClose, questionText, setQuestionText, onConfirm, editing }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>{editing ? 'Edit Question' : 'Add New Question'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label='Question Text'
          type='text'
          fullWidth
          variant='outlined'
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={onConfirm}>
          {editing ? 'Save' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddEditQuestionDialog
