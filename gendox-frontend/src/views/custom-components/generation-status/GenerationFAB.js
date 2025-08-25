import React, { useState, useEffect } from 'react'
import {
  Fab,
  Badge,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import ErrorIcon from '@mui/icons-material/Error'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useGeneration } from 'src/views/pages/tasks/document-digitization/table-hooks/GenerationContext'

const GenerationFAB = () => {
  const { hasActiveGenerations, activeGenerations, completeGeneration, retryGeneration } = useGeneration()
  const [open, setOpen] = useState(false)

  // Auto-close dialog when all generations are complete
  useEffect(() => {
    if (!hasActiveGenerations && open) {
      setOpen(false)
    }
  }, [hasActiveGenerations, open])

  if (!hasActiveGenerations) return null

  const generations = Array.from(activeGenerations.values())
  const runningCount = generations.filter(gen => gen.status === 'running').length
  const failedCount = generations.filter(gen => gen.status === 'failed').length

  const getTypeLabel = (type) => {
    switch (type) {
      case 'single': return 'Single Document'
      case 'all': return 'All Documents'
      case 'new': return 'New Documents'
      case 'selected': return 'Selected Documents'
      case 'resumed': return 'Document Processing'
      case 'unknown': return 'Document Processing'
      default: return 'Document Processing'
    }
  }

  const getDocumentInfo = (generation) => {
    if (generation.documentNames) {
      // Format document names with better spacing
      return generation.documentNames.split(', ').join(' • ')
    }
    
    // Fallback descriptions when we don't have document names
    switch (generation.type) {
      case 'single':
        return 'Single document'
      case 'all':
        return 'All documents'
      case 'new':
        return 'New documents'
      case 'selected':
        return 'Selected documents'
      case 'resumed':
        return generation.documentNames || 'Background processing'
      default:
        return 'Documents'
    }
  }

  const getStatusDescription = (generation) => {
    if (generation.status === 'failed') {
      return 'Processing failed'
    }
    return 'Processing...'
  }


  return (
    <>
      <Zoom in={hasActiveGenerations}>
        <Fab
          color={failedCount > 0 ? "error" : "primary"}
          size="medium"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 24,
            zIndex: 9999, // Higher z-index to appear above other dialogs
            animation: runningCount > 0 ? 'pulse 2s infinite' : 'none',
            opacity: 0.9,
            '&:hover': {
              opacity: 1
            },
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.4)'
              },
              '70%': {
                boxShadow: '0 0 0 8px rgba(25, 118, 210, 0)'
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)'
              }
            }
          }}
        >
          <Badge badgeContent={activeGenerations.size} color="secondary">
            <AutoAwesomeIcon fontSize="small" />
          </Badge>
        </Fab>
      </Zoom>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '70vh'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {(() => {
                const totalDocuments = generations.reduce((sum, gen) => sum + (gen.totalDocuments || 1), 0)
                return `Digitizing ${totalDocuments} Document${totalDocuments !== 1 ? 's' : ''}`
              })()}
            </Typography>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ px: 0 }}>
          <List sx={{ pt: 0 }}>
            {generations.map((generation) => {
              const progress = generation.totalItems 
                ? (generation.completedItems / generation.totalItems) * 100 
                : undefined

              return (
                <ListItem 
                  key={`${generation.taskId}-${generation.documentId || 'all'}`}
                  sx={{ 
                    flexDirection: 'column', 
                    alignItems: 'stretch',
                    backgroundColor: generation.status === 'failed' 
                      ? 'error.50' 
                      : 'transparent',
                    mb: 1,
                    borderRadius: 1,
                    border: generation.status === 'failed' 
                      ? '1px solid' 
                      : 'none',
                    borderColor: 'error.light'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                        {generation.status === 'failed' ? (
                          <ErrorIcon color="error" />
                        ) : (
                          <CheckCircleIcon color="success" />
                        )}
                      </ListItemIcon>
                      
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {getTypeLabel(generation.type)}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            lineHeight: 1.3,
                            maxWidth: '300px',
                            wordBreak: 'break-word',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {getDocumentInfo(generation)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label={generation.status === 'failed' ? 'Failed' : 'Processing'}
                        color={generation.status === 'failed' ? 'error' : 'primary'}
                        variant={generation.status === 'failed' ? 'filled' : 'outlined'}
                      />
                      
                      {generation.status === 'failed' && (
                        <>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => retryGeneration(generation.taskId, generation.documentId)}
                            title="Retry generation"
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => completeGeneration(generation.taskId, generation.documentId)}
                            title="Dismiss"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </Box>

                  {generation.status === 'failed' && generation.error && (
                    <Typography variant="caption" color="error.main" sx={{ mb: 1, px: 1 }}>
                      {generation.error}
                    </Typography>
                  )}

                  {progress !== undefined && generation.status === 'running' && (
                    <Box sx={{ mb: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress}
                        sx={{ mb: 0.5 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Typography variant="caption">
                          {generation.completedItems} of {generation.totalItems} pages processed
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {progress === undefined && generation.status === 'running' && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <Typography variant="caption">
                        {getStatusDescription(generation)}
                      </Typography>
                    </Box>
                  )}
                </ListItem>
              )
            })}
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default GenerationFAB