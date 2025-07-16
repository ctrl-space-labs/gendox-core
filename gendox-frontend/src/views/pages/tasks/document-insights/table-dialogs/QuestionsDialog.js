import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextareaAutosize,
  IconButton,
  Box
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

const QuestionsDialog = ({ open, onClose, questions, setQuestions, onConfirm, readOnly = false }) => {
  const theme = useTheme()
  const safeQuestions = Array.isArray(questions) ? questions : ['']

  const handleQuestionChange = (idx, value) => {
    const updated = [...questions]
    updated[idx] = value
    setQuestions(updated)
  }

  const handleAddQuestion = () => {
    setQuestions([...questions, ''])
  }

  const handleRemoveQuestion = idx => {
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>{readOnly ? 'View Question' : 'Add New Question'}</DialogTitle>
     
      <DialogContent>
       {safeQuestions.map((q, idx) => (

          <Box key={idx} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
            <TextareaAutosize
              autoFocus={idx === safeQuestions.length - 1}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '12px 16px',
                fontSize: '1rem',
                fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
                borderRadius: 6,
                border: `1px solid ${theme.palette.primary.main}`,
                backgroundColor: 'transparent',
                color: `${theme.palette.text.primary}`,
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none',
                cursor: readOnly ? 'default' : 'text'
              }}
              value={q}
              onChange={e => !readOnly && handleQuestionChange(idx, e.target.value)}
              aria-label={`Question ${idx + 1}`}
              readOnly={readOnly}
            />
            {!readOnly && questions.length > 1 && (
              <IconButton
                aria-label='Remove question'
                onClick={() => handleRemoveQuestion(idx)}
                sx={{ ml: 1, mt: 1 }}
                size='small'
              >
                <DeleteIcon fontSize='small' />
              </IconButton>
            )}
          </Box>
        ))}
        {!readOnly && (
          <Button startIcon={<AddIcon />} onClick={handleAddQuestion} sx={{ mb: 1 }} variant='outlined' fullWidth>
            Add New
          </Button>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='outlined'>
          Close
        </Button>
        {!readOnly && (
          <Button variant='outlined' onClick={onConfirm}>
            {'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default QuestionsDialog
