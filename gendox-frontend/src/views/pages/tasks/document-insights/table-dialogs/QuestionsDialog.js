import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextareaAutosize } from '@mui/material'

const QuestionsDialog = ({
  open,
  onClose,
  questionText,
  setQuestionText,
  onConfirm,
  editing,
  readOnly = false // new prop for readonly mode
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>{editing ? 'Edit Question' : readOnly ? 'View Question' : 'Add New Question'}</DialogTitle>
      <DialogContent>
        <TextareaAutosize
          autoFocus
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px 16px',
            fontSize: '1rem',
            fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
            borderRadius: 6,
            border: '1px solid rgba(0, 0, 0, 0.23)',
            backgroundColor: 'transparent',
            color: 'inherit',
            resize: 'vertical',
            boxSizing: 'border-box',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            outline: 'none',
            cursor: readOnly ? 'default' : 'text'
          }}
          onFocus={e => {
            if (!readOnly) {
              e.target.style.borderColor = '#1976d2' // MUI primary color on focus
              e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.2)'
            }
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)'
            e.target.style.boxShadow = 'none'
          }}
          value={questionText}
          onChange={e => !readOnly && setQuestionText(e.target.value)}
          aria-label='Question Text'
          readOnly={readOnly}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='contained' sx={{ textTransform: 'none', fontWeight: 600 }}>
          Close
        </Button>
        {!readOnly && (
          <Button variant='contained' onClick={onConfirm} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {editing ? 'Save' : 'Add'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default QuestionsDialog
