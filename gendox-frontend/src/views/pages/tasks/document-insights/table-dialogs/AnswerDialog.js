import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  Box,
  TextareaAutosize
} from '@mui/material'
import { useTheme } from '@mui/material/styles'

const AnswerDialog = ({ open, onClose, answer }) => {
  if (!answer) return null

  const theme = useTheme()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="answer-dialog-title"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: theme.shadows[24],
          backgroundColor: theme.palette.mode === 'dark'
            ? theme.palette.background.paper + 'cc' // slight transparency in dark mode
            : theme.palette.background.paper,
          color: theme.palette.text.primary,
          backdropFilter: 'blur(12px)'
        }
      }}
      
    >
      <DialogTitle
        id="answer-dialog-title"
        sx={{
          fontWeight: 'bold',
          fontSize: '1.6rem',
          letterSpacing: '0.08em',
          textAlign: 'center',
          color: theme.palette.primary.main,
          mb: 1
        }}
      >
        Answer Details
      </DialogTitle>

      <Divider sx={{ borderColor: theme.palette.divider }} />

      <DialogContent sx={{ py: 3 }}>
        {/** Answer Value */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.primary.secondary,
              fontWeight: 600,
              letterSpacing: '0.12em',
              mb: 0.7,
              textTransform: 'uppercase',
              userSelect: 'none'
            }}
          >
            Answer Value
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              wordBreak: 'break-word',
              color: theme.palette.text.primary
            }}
          >
            {answer.answerValue || 'N/A'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />

        {/** Answer Flag */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.secondary.light,
              fontWeight: 600,
              letterSpacing: '0.12em',
              mb: 0.7,
              textTransform: 'uppercase',
              userSelect: 'none'
            }}
          >
            Answer Flag
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              fontFamily: 'monospace',
              letterSpacing: '0.08em',
              color: theme.palette.text.secondary
            }}
          >
            {answer.answerFlagEnum || 'N/A'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />

        {/** Message */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 600,
              letterSpacing: '0.12em',
              mb: 0.7,
              textTransform: 'uppercase',
              userSelect: 'none'
            }}
          >
            Message
          </Typography>

          <TextareaAutosize
            aria-label="Answer Message"
            minRows={5}
            value={answer.message || 'N/A'}
            readOnly
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '1rem',
              fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
              borderRadius: 6,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: 'transparent',
              color: theme.palette.text.primary,
              resize: 'vertical',
              boxSizing: 'border-box',
              outline: 'none',
              userSelect: 'text'
            }}
            onFocus={e => {
              e.target.style.borderColor = theme.palette.primary.main
              e.target.style.boxShadow = `0 0 0 3px ${theme.palette.primary.main}33`
            }}
            onBlur={e => {
              e.target.style.borderColor = theme.palette.divider
              e.target.style.boxShadow = 'none'
            }}
          />
        </Box>
      </DialogContent>

      <Divider sx={{ borderColor: theme.palette.divider }} />

      <DialogActions sx={{ justifyContent: 'center', py: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          sx={{
            width: 140,
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            letterSpacing: '0.05em',
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AnswerDialog
