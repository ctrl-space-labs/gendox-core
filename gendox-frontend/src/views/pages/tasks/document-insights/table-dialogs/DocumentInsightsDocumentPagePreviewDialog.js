import React, { useState, useEffect, useRef, forwardRef } from 'react'
import {
  Dialog,
  DialogContent,
  Box,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  AppBar,
  Toolbar,
  Collapse,
  Paper,
  Tooltip
} from '@mui/material'
import { useDispatch } from 'react-redux'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import Divider from '@mui/material/Divider'
import EditIcon from '@mui/icons-material/Edit'
import taskService from 'src/gendox-sdk/taskService'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import DescriptionIcon from '@mui/icons-material/Description'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import DownloadIcon from '@mui/icons-material/Download'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/router'
import { isFileTypeSupported } from 'src/utils/tasks/taskUtils'
import GenerateConfirmDialog from 'src/utils/dialogs/GenerateConfirmDialog'
import SectionCard from 'src/views/pages/documents-components/SectionCard'
import { fetchDocument } from 'src/store/activeDocument/activeDocument'
import { localStorageConstants } from 'src/utils/generalConstants'
import TextareaAutosizeStyled from '../../helping-components/TextareaAutosizeStyled'
import DocumentInsightsDocumentAddNewDialog from './DocumentInsightsDocumentAddNewDialog'

const TESTING_SUPPORTING_DOCUMENTS = [
  { documentId: 'doc-123', name: 'Sample Document 1.pdf', url: 'https://example.com/sample-document-1.pdf' },
  { documentId: 'doc-456', name: 'Sample Document 2.docx', url: 'https://example.com/sample-document-2.docx' },
  { documentId: 'doc-789', name: 'Sample Document 3.txt', url: 'https://example.com/sample-document-3.txt' },
  { documentId: 'doc-101', name: 'Sample Document 4.pptx', url: 'https://example.com/sample-document-4.pptx' },
  { documentId: 'doc-112', name: 'Sample Document 5.xlsx', url: 'https://example.com/sample-document-5.xlsx' },
  { documentId: 'doc-131', name: 'Sample Document 6.pdf', url: 'https://example.com/sample-document-6.pdf' }
]

const CleanCollapse = ({ title, open, onToggle, children }) => (
  <Paper
    elevation={0}
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      overflow: 'hidden',
      backgroundColor: 'background.paper'
    }}
  >
    {/* Header */}
    <Box
      onClick={onToggle}
      sx={{
        px: 2.5,
        py: 1.8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        '&:hover': { backgroundColor: 'action.hover' }
      }}
    >
      <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
        {title}
      </Typography>

      <IconButton size='small'>{open ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
    </Box>

    <Collapse in={open} timeout={180}>
      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          p: 2.5,
          backgroundColor: 'action.hover'
        }}
      >
        {children}
      </Box>
    </Collapse>
  </Paper>
)

const DocumentPagePreviewDialog = ({
  open,
  onClose,
  document,
  onDocumentUpdate,
  generateSingleDocument,
  dialogLoading,
  onExportCsv,
  isExportingCsv,
  onDelete
}) => {
  const dispatch = useDispatch()
  const [fullscreen, setFullscreen] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [promptValue, setPromptValue] = useState('')
  const [openAddDocDialog, setOpenAddDocDialog] = useState(false)
  const [supportingDocs, setSupportingDocs] = useState([])

  const router = useRouter()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { organizationId, projectId, taskId } = router.query

  useEffect(() => {
    if (document) {
      dispatch(fetchDocument({ documentId: document.documentId, token }))
    }
  }, [document, dispatch, token])

  useEffect(() => {
    if (document) {
      if (open) {
        setPromptValue(document.prompt || '')
      }
    }
  }, [open, document])

  useEffect(() => {
    if (document?.supportingDocuments?.length) {
      setSupportingDocs(document.supportingDocuments)
    } else {
      setSupportingDocs(TESTING_SUPPORTING_DOCUMENTS)
    }
  }, [document])

  const handleClose = () => {
    setFullscreen(false)
    onClose()
  }

  const handleSave = async () => {
    if (!document) return

    setSaving(true)
    try {
      const updateData = {
        taskNodeId: document.id,
        prompt: promptValue
      }

      await taskService.updateTaskNodeForDocumentMetadata(organizationId, projectId, taskId, updateData, token)

      setEditMode(false)
      toast.success('Document updated successfully!')
      if (onDocumentUpdate) {
        onDocumentUpdate()
      }
    } catch (error) {
      console.error('Error updating document:', error)
      toast.error('Failed to update document')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setPromptValue(document?.prompt || '')
  }

  const handleRemoveSupportingDoc = docId => {
    setSupportingDocs(prev => prev.filter(d => d.documentId !== docId))

    toast.success('Supporting document removed')
  }

  const handleGenerateClick = () => {
    const hasGeneratedContent = document.length > 0

    if (hasGeneratedContent) {
      // Show confirmation dialog for regenerate
      setConfirmRegenerate(true)
    } else {
      // Direct generate for first time
      handleGenerate()
    }
  }

  const handleGenerate = async () => {
    if (generateSingleDocument && document) {
      try {
        setIsGenerating(true)
        setConfirmRegenerate(false)
        setShowDetails(false) // Close the config section

        await generateSingleDocument(document)

        // Refresh the page nodes after generation
        await fetchAnswerNodes(0, false)
      } catch (error) {
        console.error('Generation failed:', error)
        // Error is already handled in the generation hook
      } finally {
        setIsGenerating(false)
      }
    } else {
      console.warn('generateSingleDocument function not provided')
      toast.error('Generation function not available')
    }
  }

  const handleConfirmRegenerate = () => {
    handleGenerate()
  }

  const handleCancelRegenerate = () => {
    setConfirmRegenerate(false)
  }

  if (!document) {
    return null
  }

  return (
    <Dialog
      open={open}
      // onClose={handleClose}
      onClose={() => {}}
      disableEnforceFocus
      disableAutoFocus
      maxWidth={fullscreen ? false : 'lg'}
      fullWidth
      fullScreen={fullscreen}
      PaperProps={{
        sx: {
          height: fullscreen ? '100vh' : '90vh',
          bgcolor: 'background.default'
        }
      }}
    >
      <AppBar
        position='static'
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <DescriptionIcon color='primary' />
            <Box>
              <Typography variant='h6' component='div' color='text.primary' sx={{ fontWeight: 600 }}>
                {document?.name || 'Document Preview'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <>
              <Tooltip
                title={
                  isGenerating
                    ? 'Generation in progress...'
                    : !isFileTypeSupported(document?.url)
                    ? 'This file format is not supported for generation'
                    : document.length > 0
                    ? 'Regenerate document answers'
                    : 'Generate document answers'
                }
              >
                <span>
                  <IconButton
                    size='small'
                    onClick={handleGenerateClick}
                    sx={{ mr: 1 }}
                    disabled={!isFileTypeSupported(document?.url) || isGenerating || dialogLoading}
                  >
                    {isGenerating || dialogLoading ? <CircularProgress size={20} /> : <RocketLaunchIcon />}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title='Delete document'>
                <span>
                  <IconButton
                    size='small'
                    onClick={onDelete ? onDelete : undefined}
                    disabled={!onDelete}
                    sx={{ mr: 1, color: 'error.main' }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={isExportingCsv ? 'Exporting...' : 'Export data as CSV'}>
                <span>
                  <IconButton
                    size='small'
                    onClick={() => onExportCsv && onExportCsv(document?.id, document?.name)}
                    disabled={isExportingCsv || !onExportCsv}
                    sx={{ mr: 1 }}
                  >
                    {isExportingCsv ? <CircularProgress size={20} /> : <DownloadIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </>

            <IconButton
              onClick={() => setFullscreen(!fullscreen)}
              size='small'
              title={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>

            <IconButton onClick={handleClose} size='small'>
              <CloseIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Generation Progress Banner */}
      {(isGenerating || dialogLoading) && (
        <Box
          sx={{
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <CircularProgress size={24} sx={{ color: 'inherit' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              Generating Document Answers...
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.9, fontSize: '0.875rem' }}>
              Processing your document - you can continue viewing the content below
            </Typography>
          </Box>
        </Box>
      )}

      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Prompt Section */}
        <Paper
          elevation={0}
          sx={{
            borderBottom: 1,
            p: 2,
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}
        >
          <CleanCollapse title='Document Details' open={showDetails} onToggle={() => setShowDetails(!showDetails)}>
            {/* PROMPT AREA */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  Prompt
                </Typography>

                {!editMode ? (
                  <IconButton size='small' onClick={() => setEditMode(true)}>
                    <EditIcon fontSize='small' />
                  </IconButton>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant='outlined' size='small' onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button variant='contained' size='small' onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </Box>
                )}
              </Box>

              {!editMode ? (
                <Typography
                  sx={{
                    p: 2,
                    backgroundColor: 'background.paper',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    whiteSpace: 'pre-wrap',
                    minHeight: 40,
                    fontFamily: 'monospace'
                  }}
                >
                  {promptValue || 'No prompt specified'}
                </Typography>
              ) : (
                <TextareaAutosizeStyled
                  value={promptValue}
                  onChange={e => setPromptValue(e.target.value)}
                  minRows={3}
                  autoFocus
                />
              )}
            </Box>

            {/* SPACE & DIVIDER */}
            <Box sx={{ my: 3 }}>
              <Divider />
            </Box>

            {/* SUPPORTING DOCUMENTS AREA */}
            <Box>
              <Typography variant='body2' sx={{ fontWeight: 600, mb: 1 }}>
                Supporting Documents
              </Typography>

              <Button
                variant='outlined'
                startIcon={<DocumentScannerIcon />}
                onClick={() => setOpenAddDocDialog(true)}
                sx={{ mb: 2 }}
              >
                Add Document
              </Button>

              {/* DOCUMENT LIST */}
              <Box
                sx={{
                  maxHeight: 260,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                {supportingDocs.map(doc => (
                  <Paper
                    key={doc.documentId}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: 'background.paper',
                      transition: '0.15s ease',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'primary.dark'
                        }}
                      >
                        <DescriptionIcon fontSize='small' />
                      </Box>

                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{doc.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {doc.documentId}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {doc.url && (
                        <Button
                          variant='outlined'
                          size='small'
                          href={doc.url}
                          target='_blank'
                          sx={{ textTransform: 'none' }}
                        >
                          Open
                        </Button>
                      )}

                      <Tooltip title='Remove'>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleRemoveSupportingDoc(doc.documentId)}
                        >
                          <DeleteOutlineIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          </CleanCollapse>
        </Paper>

        <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <ResponsiveCardContent
            sx={{
              backgroundColor: 'action.hover',
              py: 6,
              px: 4,
              minHeight: fullscreen ? 'calc(100vh - 200px)' : '50vh',
              opacity: isGenerating ? 0.6 : 1,
              transition: 'opacity 0.3s ease',
              pointerEvents: isGenerating ? 'none' : 'auto'
            }}
          >
            <SectionCard />
          </ResponsiveCardContent>

          {/* Subtle loading overlay for content area */}
          {(isGenerating || dialogLoading) && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              <Box
                sx={{
                  backgroundColor: 'background.paper',
                  borderRadius: 2,
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  boxShadow: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <CircularProgress size={32} color='primary' />
                <Typography variant='body1' sx={{ color: 'text.primary', fontWeight: 500 }}>
                  Content will refresh when generation completes
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Regenerate Confirmation Dialog */}
      <GenerateConfirmDialog
        open={confirmRegenerate}
        onClose={handleCancelRegenerate}
        onConfirm={handleConfirmRegenerate}
        type='document'
      />
      <DocumentInsightsDocumentAddNewDialog
        open={openAddDocDialog}
        onClose={() => setOpenAddDocDialog(false)}
        existingDocuments={document?.supportingDocuments || []}
        organizationId={organizationId}
        projectId={projectId}
        taskId={taskId}
        token={token}
        onConfirm={() => {
          setOpenAddDocDialog(false)
          if (onDocumentUpdate) onDocumentUpdate()
        }}
      />
    </Dialog>
  )
}

export default DocumentPagePreviewDialog
