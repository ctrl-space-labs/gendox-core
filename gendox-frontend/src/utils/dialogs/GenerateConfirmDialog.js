// ** React Imports
import React from 'react'

// ** MUI Imports
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'

/**
 * Generation Types and their configurations
 */
const GENERATION_CONFIGS = {
  all: {
    title: 'Regenerate All Documents',
    description: 'Some documents already have generated answers. Regenerating will replace all existing answers with new ones.',
    warning: '⚠️ This action cannot be undone. All existing answers will be lost.',
    buttonText: 'Regenerate All',
    buttonColor: 'warning',
    showWarning: true
  },
  new: {
    title: 'Generate New Documents', 
    description: 'This will generate answers for documents that don\'t have existing content yet. Only documents with prompts that haven\'t been generated will be processed.',
    info: 'ℹ️ This is a safe operation - no existing content will be overwritten.',
    buttonText: 'Generate New',
    buttonColor: 'primary',
    showWarning: false
  },
  selected: (count) => ({
    title: `Regenerate Selected Documents (${count})`,
    description: 'Some selected documents already have generated answers. Regenerating will replace existing answers with new ones.',
    warning: '⚠️ This action cannot be undone. Existing answers will be lost.',
    buttonText: 'Regenerate Selected',
    buttonColor: 'warning',
    showWarning: true
  }),
  document: {
    title: 'Regenerate Document Answers',
    description: 'This document already has generated answers. Regenerating will replace all existing answers with new ones.',
    warning: '⚠️ This action cannot be undone. All current answers will be lost.',
    buttonText: 'Regenerate Answers',
    buttonColor: 'warning',
    showWarning: true
  }
}

/**
 * Reusable Generation Confirmation Dialog Component
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {function} props.onClose - Function called when dialog is closed
 * @param {function} props.onConfirm - Function called when generation is confirmed
 * @param {string} props.type - Generation type: 'all', 'new', 'selected', 'document'
 * @param {number} [props.selectedCount] - Number of selected documents (for 'selected' type)
 * @param {string} [props.customTitle] - Custom title override
 * @param {string} [props.customDescription] - Custom description override
 * @param {string} [props.customWarning] - Custom warning override
 * @param {string} [props.customButtonText] - Custom button text override
 */
export const GenerateConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  type,
  selectedCount = 0,
  customTitle,
  customDescription,
  customWarning,
  customButtonText
}) => {
  // Get configuration based on type
  const getConfig = () => {
    if (type === 'selected' && typeof GENERATION_CONFIGS.selected === 'function') {
      return GENERATION_CONFIGS.selected(selectedCount)
    }
    return GENERATION_CONFIGS[type] || GENERATION_CONFIGS.new
  }

  const config = getConfig()

  // Use custom values if provided, otherwise use config values
  const title = customTitle || config.title
  const description = customDescription || config.description
  const warning = customWarning || config.warning
  const info = config.info
  const buttonText = customButtonText || config.buttonText
  const buttonColor = config.buttonColor
  const showWarning = config.showWarning

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="generate-confirmation-dialog-title"
    >
      <DialogTitle id="generate-confirmation-dialog-title">
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        
        {showWarning && warning && (
          <Typography variant="body2" color="warning.main" sx={{ fontWeight: 500 }}>
            {warning}
          </Typography>
        )}
        
        {!showWarning && info && (
          <Typography variant="body2" color="info.main" sx={{ fontWeight: 500 }}>
            {info}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          size="medium"
        >
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          color={buttonColor}
          size="medium"
          startIcon={<RocketLaunchIcon />}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GenerateConfirmDialog