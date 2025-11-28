import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
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
  IconButton,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box
} from '@mui/material'
import Collapse from '@mui/material/Collapse'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import toast from 'react-hot-toast'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { useTheme } from '@mui/material/styles'
import { fetchAiModels } from 'src/store/activeProjectAgent/activeProjectAgent'
import { fetchExampleTools } from 'src/store/activeProjectAgent/activeProjectAgent'
import { localStorageConstants } from 'src/utils/generalConstants'
import { useRouter } from 'next/router'
import { sortModels } from 'src/utils/sortModels'
import { updateTask, fetchTasks, createTask } from 'src/store/activeTask/activeTask'
import { set } from 'nprogress'

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

const CreateTaskDialog = ({ open, onClose, initialData = {}, editMode = false, TASK_TYPE_MAP }) => {
  console.log('Initial Data:', initialData)
  const router = useRouter()
  const dispatch = useDispatch()
  const theme = useTheme()
  const { organizationId, projectId } = router.query
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { isFetchingAiModels, aiModels } = useSelector(state => state.activeProjectAgent)
  const { completionModels } = aiModels

  // console.log('Completion Models in CreateTaskDialog:', completionModels)
  const [task, setTask] = useState({
    title: '',
    description: '',
    taskType: '',
    taskPrompt: '',
    topP: '',
    temperature: '',
    maxToken: '',
    completionModel: ''
  })
  const [errors, setErrors] = useState({})
  const [showAdvanced, setShowAdvanced] = useState(false)

  console.log('Task State:', task)

  // --- Load initial data when editing ---
  useEffect(() => {
    if (open) {
      setTask({
        title: initialData.title || '',
        description: initialData.description || '',
        taskType: initialData.taskType?.name || initialData.taskType || '',
        taskPrompt: initialData.taskPrompt || '',
        topP: initialData.topP || '',
        temperature: initialData.temperature || '',
        maxToken: initialData.maxToken || '',
        completionModel: initialData.completionModel?.name || ''
      })
      setErrors({})
    }
  }, [open, initialData])

  // Fetch AI models on mount
  useEffect(() => {
    if (organizationId && projectId && token) {
      dispatch(fetchAiModels({ organizationId, projectId, token }))
    }
    if (token) {
      dispatch(fetchExampleTools({ token }))
    }
  }, [organizationId, projectId, token, dispatch])

  const handleChange = (key, value) => {
    setTask(prev => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const newErrors = {}

    // Task Prompt (can be empty, but if exists must be >= 5 chars)
    if (task.taskPrompt && task.taskPrompt.length < 5) {
      newErrors.taskPrompt = 'Task prompt must be at least 5 characters'
    }

    // Top P (must be between 0 and 1)
    if (task.topP !== undefined && task.topP !== null && task.topP !== '') {
      if (task.topP < 0 || task.topP > 1) {
        newErrors.topP = 'Top P must be between 0 and 1'
      }
    }

    // Temperature (must be between 0 and 2)
    if (task.temperature !== undefined && task.temperature !== null && task.temperature !== '') {
      if (task.temperature < 0 || task.temperature > 1) {
        newErrors.temperature = 'Temperature must be between 0 and 1'
      }
    }

    // Max Tokens (must be positive integer)
    if (task.maxToken !== undefined && task.maxToken !== null && task.maxToken !== '') {
      if (task.maxToken <= 0) {
        newErrors.maxToken = 'Max tokens must be a positive number'
      }
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (task.title.trim() === '') return
    if (!validate()) return

    try {
      const payload = {
        projectId,
        type: task.taskType, 
        title: task.title,
        description: task.description,
        taskPrompt: task.taskPrompt,
        maxToken: task.maxToken || null,
        temperature: task.temperature ? Number(task.temperature) : null, 
        topP: task.topP ? Number(task.topP) : null,
        completionModel: task.completionModel ? { name: task.completionModel } : null 
      }

      if (editMode) {
        await dispatch(
          updateTask({
            organizationId,
            projectId,
            taskId: initialData.id,
            token,
            updatePayload: payload
          })
        ).unwrap()

        toast.success('Task updated successfully.')
      } else {
        await dispatch(
          createTask({
            organizationId,
            projectId,
            taskPayload: payload,
            token
          })
        ).unwrap()

        toast.success('Task created successfully.')
      }

      dispatch(fetchTasks({ organizationId, projectId, token }))
      setShowAdvanced(false)
      onClose()
    } catch (err) {
      toast.error('Failed to save task.')
    }
  }

  const handleClose = () => {
    setShowAdvanced(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600
        }}
      >
        {editMode ? 'Edit Task' : 'Create New Task'}
      </DialogTitle>
      <Divider />
      <DialogContent>
        {!editMode ? (
          <RadioGroup value={task.taskType} onChange={e => handleChange('taskType', e.target.value)} sx={{ mb: 2 }}>
            {TASK_OPTIONS.map(option => (
              <Box
                key={option.value}
                sx={{
                  border:
                    task.taskType === option.value
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: 2,
                  mb: 1,
                  cursor: 'pointer',
                  backgroundColor:
                    task.taskType === option.value
                      ? theme.palette.primary.main + '10' // 10% tint of primary
                      : theme.palette.background.paper,
                  transition: 'border-color 0.3s ease',
                  '&:hover': { borderColor: theme.palette.primary.main }
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
              p: 3,
              mb: 2,
              mt: 2,
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

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, mb: 2 }}>
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
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mt: 3
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
              Advanced Settings
            </Typography>

            <Tooltip title='Configure advanced parameters for your task' arrow>
              <span>
                <IconButton color='primary' sx={{ ml: 1, mb: 0 }}>
                  <InfoOutlinedIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          <IconButton onClick={() => setShowAdvanced(prev => !prev)}>
            <ExpandMoreIcon
              sx={{
                transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: '0.3s'
              }}
            />
          </IconButton>
        </Box>

        <Collapse in={showAdvanced}>
          <Box>
            <TextField
              margin='dense'
              label='Task Prompt'
              type='text'
              fullWidth
              multiline
              minRows={6}
              variant='outlined'
              value={task.taskPrompt || ''}
              onChange={e => handleChange('taskPrompt', e.target.value)}
              error={Boolean(errors.taskPrompt)}
              helperText={errors.taskPrompt}
              sx={{
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />

            <FormControl fullWidth sx={{ mt: 3 }}>
              <Autocomplete
                options={sortModels(completionModels)}
                getOptionLabel={option => option.name}
                value={completionModels.find(model => model.name === task.completionModel) || null}
                onChange={(_, value) => handleChange('completionModel', value?.name || '')}
                loading={isFetchingAiModels}
                disableClearable
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Completion Model'
                    variant='outlined'
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box
                    {...props}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      p: 1,
                      borderRadius: 1,
                      transition: 'background 0.2s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light
                      }
                    }}
                  >
                    <Typography
                      variant='body1'
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary
                      }}
                    >
                      {option.name}
                    </Typography>
                    <Typography variant='body2' sx={{ fontStyle: 'italic', color: theme.palette.text.secondary }}>
                      {option.aiModelProvider?.name + '   '}
                      {option.modelTierType?.name === 'FREE_MODEL' && (
                        <Box
                          component='span'
                          sx={{
                            ml: 1,
                            px: 1.5,
                            py: 0.3,
                            backgroundColor: '#e0f2f1',
                            color: '#00695c',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            borderRadius: '6px'
                          }}
                        >
                          Free
                        </Box>
                      )}
                    </Typography>
                  </Box>
                )}
              />
            </FormControl>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <TextField
                  margin='dense'
                  label='Top P'
                  type='number'
                  fullWidth
                  variant='outlined'
                  value={task.topP || ''}
                  onChange={e => handleChange('topP', e.target.value)}
                  error={Boolean(errors.topP)}
                  helperText={errors.topP}
                  inputProps={{ max: 1, min: 0, step: 0.01 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  margin='dense'
                  label='Temperature'
                  type='number'
                  fullWidth
                  variant='outlined'
                  value={task.temperature || ''}
                  onChange={e => handleChange('temperature', e.target.value)}
                  error={Boolean(errors.temperature)}
                  helperText={errors.temperature}
                  inputProps={{ max: 1, min: 0, step: 0.01 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  margin='dense'
                  label='Max Tokens'
                  type='number'
                  fullWidth
                  variant='outlined'
                  value={task.maxToken || ''}
                  onChange={e => handleChange('maxToken', Number(e.target.value))}
                  error={Boolean(errors.maxToken)}
                  helperText={errors.maxToken}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
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
