import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Divider, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { answerFlagEnum, getAnswerFlagProps } from 'src/utils/tasks/answerFlagEnum'
import Chip from 'src/views/custom-components/mui/chip'
import ExpandableMarkdownSection from 'src/views/pages/tasks/helping-components/ExpandableMarkodownSection'
const MAX_COLLAPSED_HEIGHT = 80 // px, about 3-4 lines

const SummaryDialog = ({ open, onClose, activeDocument }) => {
  const theme = useTheme()
  if (!activeDocument) return null
  const insightsSummary = activeDocument?.insightsSummary || {}
  const flagProps = getAnswerFlagProps(insightsSummary.answerFlagEnum)

  
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xl' aria-labelledby='summary-dialog-title'>
      <DialogTitle
        id='summary-dialog-title'
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pr: 2, // space for chip, if needed
          fontWeight: 600
        }}
      >
        Summary Details
        <Chip
          label={flagProps.label}
          color={flagProps.chipColor}
          size='medium'
          icon={answerFlagEnum(insightsSummary.answerFlagEnum, theme)}
          variant='outlined'
        />
      </DialogTitle>

      <Divider sx={{ borderColor: theme.palette.divider }} />

      <DialogContent sx={{ py: 3 }}>
        <ExpandableMarkdownSection
          label='Summary'
          markdown={insightsSummary.answerText || '*N/A*'}
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

export default SummaryDialog
