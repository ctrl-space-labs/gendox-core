import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box
} from '@mui/material'

const TASK_OPTIONS = [
  {
    value: 'DOCUMENT_INSIGHTS',
    label: 'Get insights from multiple documents',
    description: 'Analyze documents and extract meaningful insights for your project.'
  },
  {
    value: 'DOCUMENT_DIGITIZATION',
    label: 'Digitize scanned documents page-by-page',
    description: 'Convert scanned documents into editable digital formats.'
  }
  // {
  //   value: 'DEEP_RESEARCH',
  //   label: 'Conduct deep research and analysis',
  //   description: 'Perform thorough research to gather and process detailed information.'
  // }
]


const CreateTaskDialog = ({ open, onClose, onSave, initialData = {}, editMode = false, TASK_TYPE_MAP }) => {
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
      // You can add title validation UI later
      return
    }
    if (!taskType) {
      setTaskTypeError('Please select what you want to do')
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
      <DialogContent>
        <Typography variant='h6' sx={{ mb: 2 }}>
          {editMode ? 'Edit Task' : 'What do you want to do?'}
        </Typography>

        {!editMode ? (
          <RadioGroup
            value={taskType}
            onChange={e => {
              setTaskType(e.target.value)
              setTaskTypeError('')
            }}
            sx={{ mb: 2 }}
          >
            {TASK_OPTIONS.map(option => (
              <Box
                key={option.value}
                sx={{
                  border: taskType === option.value ? '2px solid #1976d2' : '1px solid #ccc',
                  borderRadius: 2,
                  p: 2,
                  mb: 1,
                  cursor: 'pointer',
                  transition: 'border-color 0.3s ease',
                  '&:hover': { borderColor: '#1976d2' }
                }}
                onClick={() => setTaskType(option.value)}
              >
                <FormControlLabel
                  value={option.value}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant='subtitle1'>{option.label}</Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {option.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0 }}
                />
              </Box>
            ))}
          </RadioGroup>
        ) : (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              mb: 2,
              backgroundColor: 'background.paper',
              cursor: 'not-allowed', // optional: show not-allowed cursor
              userSelect: 'none'
            }}
          >
            <Typography variant='subtitle1' color='text.disabled' sx={{ fontWeight: 'bold' }}>
              {TASK_TYPE_MAP[initialData.taskType?.name]?.label || initialData.taskType?.name || ''}
            </Typography>
          </Box>
        )}
        {taskTypeError && (
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              mb: 2,
              backgroundColor: 'background.paper'
            }}
          >
            <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
              {formatTaskTypeName(initialData.taskType?.name)}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {initialData.taskType?.description || ''}
            </Typography>
          </Box>
        )}

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

        {/* Description input */}
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant='contained' disabled={editMode ? false : !taskType || !title.trim()}>
          {editMode ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateTaskDialog
