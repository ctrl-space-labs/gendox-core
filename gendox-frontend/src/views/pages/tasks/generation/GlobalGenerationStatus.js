import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  LinearProgress,
  CircularProgress,
  Slide,
  Portal,
  Chip,
  Tooltip
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import ErrorIcon from '@mui/icons-material/Error'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { useGeneration } from 'src/views/pages/tasks/generation/GenerationContext'

const GlobalGenerationStatus = ({ showTimeoutDialog = false }) => {
  const { activeGenerations, completeGeneration, retryGeneration } = useGeneration()
  const [expanded, setExpanded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [autoHideTimeout, setAutoHideTimeout] = useState(null)
  const [position, setPosition] = useState(() => {
    // Try to load saved position from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('generationStatusPosition')
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return { x: 0, y: 20 } // Default top center
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const generations = Array.from(activeGenerations.values())
  const totalActive = generations.length
  const runningGenerations = generations.filter(gen => gen.status === 'running')
  const failedGenerations = generations.filter(gen => gen.status === 'failed')

  const getStatusColor = () => {
    if (failedGenerations.length > 0) return 'error.main'
    return 'primary.main'
  }

  const getStatusText = () => {
    if (failedGenerations.length > 0 && runningGenerations.length === 0) {
      return totalActive === 1 ? 'Document generation failed' : `${failedGenerations.length} generation(s) failed`
    }
    if (runningGenerations.length > 0) {
      return totalActive === 1
        ? 'Document generation in progress...'
        : `${runningGenerations.length} generation(s) in progress...`
    }
    return 'Generation status'
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Clear any auto-hide timeout
    if (autoHideTimeout) {
      clearTimeout(autoHideTimeout)
      setAutoHideTimeout(null)
    }
    // Auto-restore when new generations start
    setTimeout(() => setDismissed(false), 100)
  }

  // Drag functionality
  const handleMouseDown = e => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = e => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = Math.max(0, e.clientY - dragStart.y) // Prevent going above viewport

      const newPosition = { x: newX, y: newY }
      setPosition(newPosition)
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      // Save position to localStorage when user stops dragging
      if (typeof window !== 'undefined') {
        localStorage.setItem('generationStatusPosition', JSON.stringify(position))
      }
    }
    setIsDragging(false)
  }

  // Add global mouse event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none' // Prevent text selection while dragging

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = ''
      }
    }
  }, [isDragging, dragStart, position])

  // Calculate center position based on container width
  const getCenterPosition = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const viewportWidth = window.innerWidth
      return (viewportWidth - containerWidth) / 2
    }
    return 0
  }

  // Set initial center position when component mounts (only if not dragged before)
  useEffect(() => {
    if (containerRef.current && position.x === 0 && position.y === 20) {
      const centerX = getCenterPosition()
      setPosition(prev => ({ ...prev, x: centerX }))
    }
  }, [containerRef.current]) // Only run when container ref is available

  // Auto-hide after 10 seconds if not expanded and not failed
  useEffect(() => {
    if (activeGenerations.size > 0 && !expanded && !dismissed) {
      const failedGenerations = Array.from(activeGenerations.values()).filter(gen => gen.status === 'failed')
      if (failedGenerations.length === 0) {
        const timeout = setTimeout(() => {
          setDismissed(true)
          // Auto-restore when new generations start
          setTimeout(() => setDismissed(false), 100)
        }, 10000) // Hide after 10 seconds
        setAutoHideTimeout(timeout)

        return () => clearTimeout(timeout)
      }
    }
  }, [activeGenerations.size, expanded, dismissed])

  // Don't render if no active generations or dismissed
  if (activeGenerations.size === 0 || dismissed) {
    return null
  }

  return (
    <Portal>
      <Slide direction='down' in={true} timeout={300}>
        <Paper
          ref={containerRef}
          elevation={4}
          onMouseDown={handleMouseDown}
          sx={{
            position: 'fixed',
            top: position.y,
            left: position.x === 0 ? '50%' : position.x,
            transform: position.x === 0 ? 'translateX(-50%)' : 'none', // Center initially
            zIndex: 9998,
            backgroundColor: getStatusColor(),
            color: 'primary.contrastText',
            borderRadius: 2,
            minWidth: 320,
            maxWidth: 450,
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: isDragging ? 'grabbing' : 'default',
            boxShadow: isDragging ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.2)',
            transition: isDragging ? 'none' : 'box-shadow 0.2s ease'
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: totalActive > 1 ? 'pointer' : 'default'
              }}
              onClick={() => totalActive > 1 && setExpanded(!expanded)}
            >
              {/* Drag handle */}
              <Tooltip title='Drag to reposition'>
                <Box
                  className='drag-handle'
                  sx={{
                    cursor: 'grab',
                    mr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                    '&:active': { cursor: 'grabbing' }
                  }}
                >
                  <DragIndicatorIcon sx={{ fontSize: '1rem' }} />
                </Box>
              </Tooltip>

              {runningGenerations.length > 0 && <CircularProgress size={16} sx={{ color: 'inherit', mr: 1.5 }} />}
              {failedGenerations.length > 0 && runningGenerations.length === 0 && (
                <ErrorIcon sx={{ mr: 1.5, fontSize: '1rem' }} />
              )}

              <Typography variant='body2' sx={{ flex: 1, fontWeight: 600, fontSize: '0.875rem' }}>
                {getStatusText()}
                {showTimeoutDialog && (
                  <Typography component='span' sx={{ ml: 1, fontWeight: 700, color: 'warning.light' }}>
                    <br /> This is taking too long. If it’s not expected, please contact the administrator.
                  </Typography>
                )}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {totalActive > 1 && (
                  <Tooltip title={expanded ? 'Collapse details' : 'Show details'}>
                    <IconButton size='small' sx={{ color: 'inherit', p: 0.5 }}>
                      {expanded ? <ExpandLessIcon fontSize='small' /> : <ExpandMoreIcon fontSize='small' />}
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title='Dismiss'>
                  <IconButton size='small' sx={{ color: 'inherit', p: 0.5 }} onClick={handleDismiss}>
                    <CloseIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Collapse in={expanded && totalActive > 1} timeout={300}>
              <Box sx={{ mt: 1.5, pb: 0.5 }}>
                {generations.map(gen => (
                  <GenerationItem
                    key={`${gen.taskId}-${gen.documentId || 'all'}`}
                    generation={gen}
                    onRetry={() => retryGeneration(gen.taskId, gen.documentId)}
                    onDismiss={() => completeGeneration(gen.taskId, gen.documentId)}
                  />
                ))}
              </Box>
            </Collapse>
          </Box>
        </Paper>
      </Slide>
    </Portal>
  )
}

const GenerationItem = ({ generation, onRetry, onDismiss }) => {
  const progress = generation.totalItems ? (generation.completedItems / generation.totalItems) * 100 : undefined

  const elapsedTime = Math.floor((Date.now() - generation.startTime) / 1000)

  const getTypeLabel = () => {
    switch (generation.type) {
      case 'single':
        return 'Single Document'
      case 'all':
        return 'All Documents'
      case 'new':
        return 'New Documents'
      case 'selected':
        return 'Selected Documents'
      default:
        return 'Documents'
    }
  }

  const formatTime = seconds => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <Box
      sx={{
        mb: 1,
        p: 1.5,
        backgroundColor: generation.status === 'failed' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
        borderRadius: 1,
        border: generation.status === 'failed' ? '1px solid rgba(255,255,255,0.3)' : 'none'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant='caption' sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
          {getTypeLabel()}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {generation.status === 'failed' && (
            <>
              <IconButton size='small' sx={{ color: 'inherit', p: 0.25 }} onClick={onRetry} title='Retry'>
                <RefreshIcon sx={{ fontSize: '0.875rem' }} />
              </IconButton>
              <IconButton size='small' sx={{ color: 'inherit', p: 0.25 }} onClick={onDismiss} title='Dismiss'>
                <CloseIcon sx={{ fontSize: '0.875rem' }} />
              </IconButton>
            </>
          )}

          <Chip
            size='small'
            label={generation.status === 'failed' ? 'Failed' : 'Running'}
            sx={{
              backgroundColor: generation.status === 'failed' ? 'error.dark' : 'rgba(255,255,255,0.2)',
              color: 'inherit',
              fontSize: '0.65rem',
              height: 18,
              '& .MuiChip-label': { px: 0.75 }
            }}
          />
        </Box>
      </Box>

      {generation.status === 'failed' && generation.error && (
        <Typography variant='caption' sx={{ display: 'block', mb: 0.5, opacity: 0.8, fontSize: '0.7rem' }}>
          Error: {generation.error}
        </Typography>
      )}

      {progress !== undefined && generation.status === 'running' && (
        <LinearProgress
          variant='determinate'
          value={progress}
          sx={{
            mb: 0.5,
            height: 3,
            backgroundColor: 'rgba(255,255,255,0.2)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'rgba(255,255,255,0.8)'
            }
          }}
        />
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='caption' sx={{ fontSize: '0.7rem' }}>
          {progress !== undefined
            ? `${generation.completedItems}/${generation.totalItems} pages`
            : generation.status === 'running'
            ? 'Processing...'
            : 'Failed'}
        </Typography>
        <Typography variant='caption' sx={{ fontSize: '0.7rem' }}>
          {formatTime(elapsedTime)}
        </Typography>
      </Box>
    </Box>
  )
}

export default GlobalGenerationStatus
