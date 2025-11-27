import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  InputAdornment,
  Autocomplete,
  FormControl,
  InputLabel,
  Checkbox,
  Tooltip,
  Icon,
  IconButton,
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
  console.log('Initial Data:', initialData)
  // const [title, setTitle] = useState(initialData.title || '')
  // const [description, setDescription] = useState(initialData.description || '')
  // const [taskType, setTaskType] = useState(initialData.taskType || '')
  const [taskTypeError, setTaskTypeError] = useState('')

  const [task, setTask] = useState({ ...initialData })
  const handleChange = (field, value) => {
    setTask(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    if (open) {
      setTask({
        ...initialData
      })
      setTaskTypeError('')
    }
  }, [initialData, open])

  const handleSave = () => {
    if (task.title.trim() === '') {
      // You can add title validation UI later
      return
    }
    if (!task.taskType) {
      setTaskTypeError('Please select what you want to do')
      return
    }
    onSave({ title: task.title, description: task.description, taskType: task.taskType })
    handleClose()
  }

  const handleClose = () => {
    setTask({})    
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
          <RadioGroup value={task.taskType} onChange={e => handleChange('taskType', e.target.value)} sx={{ mb: 2 }}>
            {TASK_OPTIONS.map(option => (
              <Box
                key={option.value}
                sx={{
                  border: task.taskType === option.value ? '2px solid #1976d2' : '1px solid #ccc',
                  borderRadius: 2,
                  p: 2,
                  mb: 1,
                  cursor: 'pointer',
                  transition: 'border-color 0.3s ease',
                  '&:hover': { borderColor: '#1976d2' }
                }}
                onClick={() => setTask({ ...task, taskType: option.value })}
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
          value={task.title}
          onChange={e => handleChange('title', e.target.value)}
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
          value={task.description}
          onChange={e => handleChange('description', e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          variant='contained'
          disabled={editMode ? false : !task.taskType || !task.title.trim()}
        >
          {editMode ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateTaskDialog
