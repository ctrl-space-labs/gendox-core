// ** React Imports
import React from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import CircularProgress from '@mui/material/CircularProgress'

// ** Confirmation Dialog Component
export const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  contentText,
  confirmButtonText,
  cancelButtonText,
  disableConfirm
}) => {
  const isLoading = disableConfirm
  const spinnerStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10
  }

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby='delete-confirmation-dialog-title'>
      <DialogTitle id='delete-confirmation-dialog-title' color='primary'>
        {title}
      </DialogTitle>
      {isLoading && (
        <Box sx={spinnerStyle}>
          <CircularProgress size={36} />
        </Box>
      )}
      <DialogContent
        sx={{
          filter: isLoading ? 'blur(3px)' : 'none',
          transition: 'filter 0.3s ease'
        }}
      >
        <DialogContentText>{contentText}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary'>
          {cancelButtonText}
        </Button>
        <Button onClick={onConfirm} color='error' disabled={isLoading}>
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteConfirmDialog
