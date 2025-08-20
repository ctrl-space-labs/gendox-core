import React, { useState } from 'react'
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
import { useGeneration } from 'src/contexts/GenerationContext'

const GenerationFAB = () => {
  const { hasActiveGenerations, activeGenerations, completeGeneration, retryGeneration } = useGeneration()
  const [open, setOpen] = useState(false)

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
      default: return 'Documents'
    }
  }

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
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
            zIndex: 999,
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
            <Typography variant="h6">
              Generation Status ({activeGenerations.size})
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
              const elapsedTime = Math.floor((Date.now() - generation.startTime) / 1000)

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
                        <Typography variant="caption" color="text.secondary">
                          Task: {generation.taskId}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        size="small"
                        label={generation.status === 'failed' ? 'Failed' : 'Running'}
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
                      Error: {generation.error}
                    </Typography>
                  )}

                  {progress !== undefined && generation.status === 'running' && (
                    <Box sx={{ mb: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress}
                        sx={{ mb: 0.5 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption">
                          {generation.completedItems}/{generation.totalItems} pages
                        </Typography>
                        <Typography variant="caption">
                          {formatTime(elapsedTime)} elapsed
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {progress === undefined && generation.status === 'running' && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption">
                        Processing...
                      </Typography>
                      <Typography variant="caption">
                        {formatTime(elapsedTime)} elapsed
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