import React, { useState, useEffect, useRef, forwardRef, useLayoutEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Divider,
  Typography,
  CircularProgress
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

const MAX_COLLAPSED_HEIGHT = 80

function ExpandableMarkdownSection({ label, markdown, maxHeight = MAX_COLLAPSED_HEIGHT }) {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const contentRef = useRef(null)

  useLayoutEffect(() => {
    if (contentRef.current) {
      setShowButton(contentRef.current.scrollHeight > maxHeight + 2)
    }
  }, [markdown, maxHeight])

  return (
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
        {label}
      </Typography>
      <Box
        ref={contentRef}
        sx={{
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderRadius: 2,
          minHeight: 54,
          maxHeight: expanded ? 'none' : `${maxHeight}px`,
          overflow: 'hidden',
          position: 'relative',
          transition: 'max-height 0.3s'
        }}
      >
        <GendoxMarkdownRenderer markdownText={markdown} />
      </Box>
      {showButton && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, pt: 0.5 }}>
          <Button
            size='small'
            variant='text'
            sx={{
              color: theme.palette.primary.main,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 0,
              p: 0
            }}
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        </Box>
      )}
    </Box>
  )
}

const DocumentDialog = ({
  open,
  onClose,
  document, // { id, name, prompt, structure }
  onSave,
  loading,
}) => {
  const [editMode, setEditMode] = useState(false)
  const [prompt, setPrompt] = useState(document?.prompt || '')
  const [structure, setStructure] = useState(document?.structure || '')

  

  useEffect(() => {
    if (!open) setEditMode(false)
  }, [open])

  

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
          <IconButton aria-label='Edit document' onClick={() => setEditMode(true)} sx={{ color: 'primary.main' }}>
            <EditIcon />
          </IconButton>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
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
