import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  TextField,
  Typography
} from '@mui/material'
import { useDispatch } from 'react-redux'
import { createTask, fetchTasks, duplicateTask } from 'src/store/activeTask/activeTask'
import toast from 'react-hot-toast'

const DuplicateTaskDialog = ({ open, onClose, task, organizationId, projectId, token }) => {
  const dispatch = useDispatch()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [keepQuestions, setKeepQuestions] = useState(true)
  const [keepDocuments, setKeepDocuments] = useState(true)

  useEffect(() => {
    if (task && open) {
      setTitle(task.title + ' (copy)')
      setDescription(task.description || '')
    }
  }, [task, open])

  const handleDuplicate = async () => {
    try {
      const payload = {
        taskId: task.id,
        newTitle: title,
        newDescription: description,
        keepQuestions,
        keepDocuments
      }

      await dispatch(
        duplicateTask({
          organizationId,
          projectId,
          payload,
          token
        })
      ).unwrap()

      toast.success('Task duplicated successfully!')
      dispatch(fetchTasks({ organizationId, projectId, token }))
      onClose()
    } catch (err) {
      toast.error('Failed to duplicate task.')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>Duplicate Task</DialogTitle>
      <DialogContent sx={{ mt: 1 }}>
        <Typography sx={{ mb: 4 }}>Customize the duplicated task and choose what to copy from the original:</Typography>

        {/* Task title */}
        <TextField
          fullWidth
          label='New Task Title'
          value={title}
          onChange={e => setTitle(e.target.value)}
          sx={{ mb: 2 }}
          required
        />

        {/* Task description */}
        <TextField
          fullWidth
          label='New Task Description'
          value={description}
          multiline
          minRows={3}
          onChange={e => setDescription(e.target.value)}
          sx={{ mb: 3 }}
        />

        <FormControlLabel
          control={<Checkbox checked={keepQuestions} onChange={() => setKeepQuestions(!keepQuestions)} />}
          label='Copy questions'
        />

        <FormControlLabel
          control={<Checkbox checked={keepDocuments} onChange={() => setKeepDocuments(!keepDocuments)} />}
          label='Copy documents'
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={handleDuplicate}>
          Duplicate
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DuplicateTaskDialog
