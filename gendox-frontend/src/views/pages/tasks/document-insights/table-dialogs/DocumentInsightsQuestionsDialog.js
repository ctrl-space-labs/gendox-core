import React from 'react'
import { useState, useEffect } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Box,
  CircularProgress
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandableMarkdownSection from '../../helping-components/ExpandableMarkodownSection'
import TextareaAutosizeStyled from '../../helping-components/TextareaAutosizeStyled'
const MAX_COLLAPSED_HEIGHT = 80 // px, about 3-4 lines

const QuestionsDialog = ({
  open,
  onClose,
  questions,
  setQuestions,
  onConfirm,
  handleUpdateQuestion,
  activeQuestion,
  addQuestionMode = false,
  isSaving = false
}) => {
  const theme = useTheme()
  const [editMode, setEditMode] = useState(false)
  const [questionText, setQuestionText] = useState(activeQuestion?.text || '')
  const safeQuestions = Array.isArray(questions) ? questions : ['']

  const isViewMode = !addQuestionMode && !editMode
  const isEditMode = editMode
  const isAddMode = addQuestionMode

  useEffect(() => {
    setQuestionText(activeQuestion?.text || '')
  }, [activeQuestion, open])

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
    <Dialog
      open={open}
      onClose={onClose}
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
      fullWidth
      maxWidth='xl'
      aria-labelledby='question-dialog-title'
    >
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
      <DialogTitle
        id='question-dialog-title'
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 600
        }}
      >
        {isAddMode ? 'Add Questions' : isEditMode ? 'Edit Question' : 'View Question'}

        {isViewMode && (
          <Tooltip title='Edit question'>
            <IconButton aria-label='Edit question' onClick={() => setEditMode(true)} sx={{ color: 'primary.main' }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
      </DialogTitle>

      <Divider />

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
              {isAddMode ? idx + 1 : 'Q'}
            </Box>

            {isEditMode ? (
              <TextareaAutosizeStyled
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                placeholder=''
                minRows={3}
                autoFocus
              />
            ) : isAddMode ? (
              <TextareaAutosizeStyled
                autoFocus={idx === safeQuestions.length - 1}
                placeholder='Enter question text...'
                value={q}
                onChange={e => isAddMode && handleQuestionChange(idx, e.target.value)}
                aria-label={`Question ${idx + 1}`}
                readOnly={!isAddMode}
              />
            ) : (
              <Box sx={{ mt: 1 }}>
                <ExpandableMarkdownSection
                  label=''
                  markdown={questionText || '*No question text*'}
                  maxHeight={MAX_COLLAPSED_HEIGHT}
                />
              </Box>
            )}

            <Divider sx={{ my: 1 }} />

            {isAddMode && questions.length > 1 && (
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
        {isAddMode && (
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              handleAddQuestion()
            }}
            sx={{ mb: 1 }}
            variant='outlined'
            fullWidth
          >
            Add New
          </Button>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ justifyContent: 'right', py: 2 }}>
        {isEditMode ? (
          <>
            <Button
              onClick={() => {
                setEditMode(false)
                setQuestionText(activeQuestion?.text || '')
              }}
              variant='outlined'
            >
              {isSaving ? 'Saving...' : 'Cancel'}
            </Button>
            <Button
              variant='contained'
              onClick={() => {
                handleUpdateQuestion(questionText)
                setEditMode(false)
              }}
              disabled={isSaving}
            >
              {' '}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </>
        ) : isAddMode ? (
          <>
            <Button
              onClick={() => {
                setQuestions([''])
                onClose()
              }}
              variant='outlined'
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Close'}
            </Button>
            <Button variant='contained' onClick={onConfirm} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Questions'}
            </Button>
          </>
        ) : (
          <Button onClick={onClose} variant='outlined' disabled={isSaving}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default QuestionsDialog
