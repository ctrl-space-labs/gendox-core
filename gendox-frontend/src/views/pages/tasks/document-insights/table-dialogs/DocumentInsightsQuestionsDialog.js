import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextareaAutosize,
  IconButton,
  Box,
  CircularProgress
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import GendoxMarkdownRenderer from 'src/views/pages/markdown-renderer/GendoxMarkdownRenderer'

const QuestionsDialog = ({
  open,
  onClose,
  questions,
  setQuestions,
  onConfirm,
  activeQuestion,
  editMode = false,
  isSaving = false
}) => {
  const questionText = activeQuestion?.text || ''
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs' disableEnforceFocus disableRestoreFocus>
      {isSaving && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(6px)',
            pointerEvents: 'all'
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <DialogTitle>{!editMode ? 'View Question' : 'Add New Question'}</DialogTitle>

      <DialogContent>
        {safeQuestions.map((q, idx) => (
          <Box key={idx} sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
            <Box
              sx={{
                minWidth: 30,
                height: 30,
                bgcolor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
                fontWeight: 600,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                mt: '4px'
              }}
            >
              {idx + 1}
            </Box>

            {!editMode ? (
              <Box sx={{ mt: 1 }}>
                <GendoxMarkdownRenderer markdownText={questionText || '*No question text*'} />
              </Box>
            ) : (
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
                  cursor: !editMode ? 'default' : 'text'
                }}
                value={q}
                onChange={e => editMode && handleQuestionChange(idx, e.target.value)}
                aria-label={`Question ${idx + 1}`}
                readOnly={!editMode}
              />
            )}
            {editMode && questions.length > 1 && (
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
        {editMode && (
          <Button startIcon={<AddIcon />} onClick={handleAddQuestion} sx={{ mb: 1 }} variant='outlined' fullWidth>
            Add New
          </Button>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant='contained' disabled={isSaving}>
          Close
        </Button>
        {editMode && (
          <Button variant='contained' onClick={onConfirm} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default QuestionsDialog
