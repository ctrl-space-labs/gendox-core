import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText
} from '@mui/material'
const TASK_TYPES = [
  { value: 'DEEP_RESEARCH', label: 'Deep Research' },
  { value: 'DOCUMENT_INSIGHTS', label: 'Document Insights' },
  { value: 'DOCUMENT_DIGITIZATION', label: 'Document Digitization' }
]

const CreateTaskDialog = ({ open, onClose, onSave, initialData = {} }) => {
  const [title, setTitle] = useState(initialData.title || '')
  const [description, setDescription] = useState(initialData.description || '')
  const [taskType, setTaskType] = useState(initialData.taskType || '')
  const [taskTypeError, setTaskTypeError] = useState('')

  useEffect(() => {
  if (open) {
    setTitle(initialData.title || '')
    setDescription(initialData.description || '')
    setTaskType(initialData.taskType || '')
    setTaskTypeError('')
  }
}, [initialData, open])

  const handleSave = () => {
    if (title.trim() === '') {
      // Simple validation example
      return
    }
    if (!taskType) {
      setTaskTypeError('Please select a task type')
      return
    }
    onSave({ title, description, taskType })
    handleClose()
  }

  const handleClose = () => {
    setTitle('')
    setDescription('')
    setTaskType('')
    setTaskTypeError('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Create New Task</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label='Task Title'
          type='text'
          fullWidth
          variant='outlined'
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <TextField
          margin='dense'
          label='Description'
          type='text'
          fullWidth
          multiline
          minRows={3}
          variant='outlined'
          value={description}
          onChange={e => setDescription(e.target.value)}
          sx={{ mt: 2 }}
        />
        <FormControl fullWidth variant='outlined' margin='dense' sx={{ mt: 2 }} error={!!taskTypeError}>
          <InputLabel id='task-type-label'>Task Type *</InputLabel>
          <Select
            labelId='task-type-label'
            value={taskType}
            label='Task Type *'
            onChange={e => {
              setTaskType(e.target.value)
              setTaskTypeError('')
            }}
          >
            {TASK_TYPES.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
          {taskTypeError && <FormHelperText>{taskTypeError}</FormHelperText>}
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant='contained'>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateTaskDialog
