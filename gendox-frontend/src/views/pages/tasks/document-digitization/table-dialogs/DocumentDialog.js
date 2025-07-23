import React, { useState, useEffect, forwardRef } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Divider,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import EditIcon from '@mui/icons-material/Edit'
import GendoxMarkdownRenderer from 'src/views/pages/markdown-renderer/GendoxMarkdownRenderer'

const TextareaAutosizeStyled = forwardRef((props, ref) => {
  const theme = useTheme()
  return (
    <textarea
      ref={ref}
      {...props}
      style={{
        width: '100%',
        minHeight: 80,
        padding: '12px 16px',
        fontSize: '1rem',
        borderRadius: 8,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        resize: 'vertical',
        marginBottom: 16,
        outline: 'none',
        ...props.style
      }}
    />
  )
})

const DocumentDialog = ({
  open,
  onClose,
  document, // { name, prompt, structure }
  onSave
}) => {
  const [editMode, setEditMode] = useState(false)
  const [prompt, setPrompt] = useState(document?.prompt || '')
  const [structure, setStructure] = useState(document?.structure || '')

  // Reset fields when dialog/document changes
  useEffect(() => {
    if (open) {
      setPrompt(document?.prompt || '')
      setStructure(document?.structure || '')
      setEditMode(false)
    }
  }, [open, document])

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...document,
        prompt,
        structure
      })
    }
    setEditMode(false)
  }

  if (!document) return null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
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
          <IconButton aria-label="Edit document" onClick={() => setEditMode(true)}>
            <EditIcon />
          </IconButton>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
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
            Prompt
          </Typography>
          {editMode ? (
            <TextareaAutosizeStyled
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder='Enter prompt in markdown...'
              minRows={3}              
              autoFocus
            />
          ) : (
            <Box sx={{ p: 2,  minHeight: 54 }}>
              <GendoxMarkdownRenderer markdownText={document.prompt || '*No prompt*'} />
            </Box>
          )}
        </Box>

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
            Structure
          </Typography>
          {editMode ? (
            <TextareaAutosizeStyled
              value={structure}
              onChange={e => setStructure(e.target.value)}
              placeholder='Enter structure in markdown...'
              minRows={2}
              maxRows={6}
            />
          ) : (
            <Box sx={{ p: 2,  minHeight: 54 }}>
              <GendoxMarkdownRenderer markdownText={document.structure || '*No structure*'} />
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ justifyContent: 'right', py: 2 }}>
        {editMode ? (
          <>
            <Button onClick={() => setEditMode(false)} variant='outlined'>
              Cancel
            </Button>
            <Button onClick={handleSave} variant='contained'>
              Save
            </Button>
          </>
        ) : (
          <Button onClick={onClose} variant='outlined'>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default DocumentDialog
