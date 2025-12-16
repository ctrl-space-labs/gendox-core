import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Divider, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { answerFlagEnum, getAnswerFlagProps } from 'src/utils/tasks/answerFlagEnum'
import Chip from 'src/views/custom-components/mui/chip'
import ExpandableMarkdownSection from 'src/views/pages/tasks/helping-components/ExpandableMarkodownSection'
const MAX_COLLAPSED_HEIGHT = 80 // px, about 3-4 lines



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
          pr: 2, // space for chip, if needed
          fontWeight: 600
        }}
      >
        Answer Details
        <Chip
          label={flagProps.label}
          color={flagProps.chipColor}
          size='medium'
          icon={answerFlagEnum(answer.answerFlagEnum, theme)}
          variant='outlined'
        />
      </DialogTitle>

      <Divider sx={{ borderColor: theme.palette.divider }} />

      <DialogContent sx={{ py: 3 }}>
        {/* {questionText && (
          <ExpandableMarkdownSection label='Question' markdown={questionText} maxHeight={MAX_COLLAPSED_HEIGHT} />
        )} */}

        <Divider sx={{ borderColor: theme.palette.divider, mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography
            variant='caption'
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
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

        <ExpandableMarkdownSection
          label='Description'
          markdown={answer.message || '*N/A*'}
          maxHeight={MAX_COLLAPSED_HEIGHT}
        />
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
