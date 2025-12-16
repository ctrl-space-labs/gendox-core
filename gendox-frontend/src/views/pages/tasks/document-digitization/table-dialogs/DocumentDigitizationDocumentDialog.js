import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Divider,
  Tooltip,
  Typography,
  CircularProgress
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import ExpandableMarkdownSection from 'src/views/pages/tasks/helping-components/ExpandableMarkodownSection'
import TextareaAutosizeStyled from 'src/views/pages/tasks/helping-components/TextareaAutosizeStyled'

const MAX_COLLAPSED_HEIGHT = 80

const DocumentDialog = ({
  open,
  onClose,
  document, // { id, name, prompt, structure }
  onSave,
  loading,
  editMode,
  setEditMode
}) => {
  const [prompt, setPrompt] = useState(document?.prompt || '')
  const [structure, setStructure] = useState(document?.structure || '')

  useEffect(() => {
    if (!open) setEditMode(false)
  }, [open])

  useEffect(() => {
    if (document) {
      setPrompt(document.prompt || '')
      setStructure(document.structure || '')
    }
  }, [document, open])

  if (!document) return null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle
        sx={{
          fontWeight: 600,
          fontSize: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1
        }}
      >
        Document Details
        {!editMode && (
          <Tooltip title='Edit document details'>
            <IconButton aria-label='Edit document' onClick={() => setEditMode(true)} sx={{ color: 'primary.main' }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography
            variant='caption'
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              textTransform: 'uppercase',
              mb: 1,
              display: 'block'
            }}
          >
            Title
          </Typography>
          <Typography variant='h5' sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
            {document.name}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {editMode ? (
          <>
            <Typography
              variant='caption'
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                textTransform: 'uppercase',
                mb: 1,
                display: 'block'
              }}
            >
              Prompt
            </Typography>
            <TextareaAutosizeStyled
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder='Enter prompt in markdown...'
              minRows={3}
              autoFocus
            />

            <Typography
              variant='caption'
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                textTransform: 'uppercase',
                mb: 1,
                display: 'block'
              }}
            >
              Structure
            </Typography>
            <TextareaAutosizeStyled
              value={structure}
              onChange={e => setStructure(e.target.value)}
              placeholder='Enter structure in markdown...'
              minRows={2}
              maxRows={6}
            />
          </>
        ) : (
          <>
            <ExpandableMarkdownSection
              label='Prompt'
              markdown={document.prompt || '*No prompt*'}
              maxHeight={MAX_COLLAPSED_HEIGHT}
            />
            <ExpandableMarkdownSection
              label='Structure'
              markdown={document.structure || '*No structure*'}
              maxHeight={MAX_COLLAPSED_HEIGHT}
            />
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ justifyContent: 'right', py: 2 }}>
        {editMode ? (
          <>
            <Button onClick={() => setEditMode(false)} variant='outlined'>
              Cancel
            </Button>
            <Button onClick={() => onSave({ ...document, prompt, structure })} disabled={loading}>
              Save
            </Button>
          </>
        ) : (
          <Button onClick={onClose} variant='outlined'>
            Close
          </Button>
        )}
      </DialogActions>
      {loading && <CircularProgress size={24} />}
    </Dialog>
  )
}

export default DocumentDialog
