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
  new: (count) => ({
    title: count > 0 ? `Generate New for Selected (${count})` : 'Generate New Documents',
    description: count > 0
      ? `This will generate answers only for the ${count} selected document(s) that don't have existing content yet. No existing content will be overwritten.`
      : "This will generate answers for documents that don't have existing content yet. Only documents with prompts that haven't been generated will be processed.",
    info: 'ℹ️ This is a safe operation - no existing content will be overwritten.',
    buttonText: count > 0 ? `Generate New (${count})` : 'Generate New',
    buttonColor: 'primary',
    showWarning: false
  }),
  selected: (count) => ({
    title: `Regenerate Selected Documents (${count})`,
    description: 'Some selected documents already have generated answers. Regenerating will replace existing answers with new ones.',
    warning: '⚠️ This action cannot be undone. Existing answers will be lost.',
    buttonText: 'Regenerate Selected',
    buttonColor: 'warning',
    showWarning: true
  }),
  document: {
    title: 'Generate / Regenerate Document Answers',
    description: 'This document may already have generated answers. Generating will replace any existing answers with new ones.',
    buttonText: 'Generate Answers',
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
    const cfg = GENERATION_CONFIGS[type]
    if (typeof cfg === 'function') return cfg(selectedCount)
    return cfg || GENERATION_CONFIGS.new(0)
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
      disableAutoFocus
      disableEnforceFocus
      disableRestoreFocus
    >
      <DialogTitle id="generate-confirmation-dialog-title" sx={{ fontWeight: 600 }}>
        {title}
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
          autoFocus
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GenerateConfirmDialog