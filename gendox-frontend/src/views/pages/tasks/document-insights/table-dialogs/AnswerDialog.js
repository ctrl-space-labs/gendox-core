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
  Chip,
  TextareaAutosize
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
// import { answerFlagEnum } from 'src/utils/tasks/answerFlagEnum'
import { answerFlagEnum, getAnswerFlagProps } from 'src/utils/tasks/answerFlagEnum'

const AnswerDialog = ({ open, onClose, answer }) => {
  const theme = useTheme()
  if (!answer) return null
  const flagProps = getAnswerFlagProps(answer.answerFlagEnum)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm' aria-labelledby='answer-dialog-title'>
      <DialogTitle
        id='answer-dialog-title'
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 2 // space for chip, if needed
        }}
      >
        <Typography variant='h6' sx={{ fontWeight: 600 }}>
          Answer Details
        </Typography>        
        <Chip
              label={flagProps.label}
              color={flagProps.chipColor}
              size='medium'
              icon={answerFlagEnum(answer.answerFlagEnum)}
              sx={{
                fontWeight: 600,
                textTransform: 'capitalize',
                bgcolor: flagProps.chipBg || undefined,
                color: flagProps.chipText || undefined,
                fontSize: '1rem',
                pr: 4
              }}
            />
      </DialogTitle>

      <Divider sx={{ borderColor: theme.palette.divider }} />

      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant='caption'
            sx={{
              fontWeight: 700,
              color: theme.palette.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              mb: 1,
              display: 'block'
            }}
          >
            Answer Value
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2, // more space between chip and value
              p: 2,
              borderRadius: 2,
              minHeight: 54
            }}
          >           
            
            <Typography
              variant='h5'
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                wordBreak: 'break-word',
                letterSpacing: '0.01em'
              }}
            >
              {answer.answerValue || (
                <span style={{ color: theme.palette.text.disabled, fontStyle: 'italic' }}>N/A</span>
              )}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />

        {/** Description */}
        <Box>
          <Typography
            variant='caption'
            sx={{
              fontWeight: 700,
              color: theme.palette.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              mb: 1,
              display: 'block'
            }}
          >
            Description
          </Typography>

          <TextareaAutosize
            aria-label='Answer Message'
            minRows={5}
            value={answer.message || 'N/A'}
            readOnly
            style={{
              width: '100%',
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

      <DialogActions sx={{ justifyContent: 'right', py: 2 }}>
        <Button onClick={onClose} variant='outlined'>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AnswerDialog
