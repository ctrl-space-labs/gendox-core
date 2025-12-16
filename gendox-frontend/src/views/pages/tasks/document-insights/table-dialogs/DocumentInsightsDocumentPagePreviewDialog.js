import React, { useState, useEffect } from 'react'
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
  Paper,
  Tooltip
} from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { useDispatch, useSelector } from 'react-redux'
import CloseIcon from '@mui/icons-material/Close'
import Divider from '@mui/material/Divider'
import EditIcon from '@mui/icons-material/Edit'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner'
import DescriptionIcon from '@mui/icons-material/Description'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import DownloadIcon from '@mui/icons-material/Download'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/router'
import { isFileTypeSupported } from 'src/utils/tasks/taskUtils'
import CleanCollapse from 'src/views/custom-components/mui/collapse'
import GenerateConfirmDialog from 'src/utils/dialogs/GenerateConfirmDialog'
import DocumentTextComponent from '../../helping-components/DocumentTextComponent'
import { fetchDocument, fetchDocuments, resetSupportingDocuments } from 'src/store/activeDocument/activeDocument'
import { localStorageConstants } from 'src/utils/generalConstants'
import TextareaAutosizeStyled from '../../helping-components/TextareaAutosizeStyled'
import AddNewDocumentDialog from '../../helping-components/AddNewDocumentDialog'
import { updateTaskNode } from 'src/store/activeTaskNode/activeTaskNode'
import { DeleteConfirmDialog } from 'src/utils/dialogs/DeleteConfirmDialog'
import WarningIcon from '@mui/icons-material/Warning'
import TruncatedText from 'src/views/custom-components/truncated-text/TrancatedText'


const DocumentPagePreviewDialog = ({
  open,
  onClose,
  activeDocument,
  generateSingleDocument,
  loading,
  onExportCsv,
  isExportingCsv,
  onDelete,
  reloadAll
}) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const { organizationId, projectId, taskId } = router.query
  const [fullscreen, setFullscreen] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [showDocumentText, setShowDocumentText] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [promptValue, setPromptValue] = useState('')
  const [openAddDocDialog, setOpenAddDocDialog] = useState(false)
  const [dialogLoading, setDialogLoading] = useState(false)
  const [tempSupportingDocs, setTempSupportingDocs] = useState([])
  const [hasBreakingChanges, setHasBreakingChanges] = useState(false)
  const [openConfirmAnswersDelete, setOpenConfirmAnswersDelete] = useState(false)
  const { supportingDocuments, isLoading } = useSelector(state => state.activeDocument)

  const { sections, isBlurring } = useSelector(state => state.activeDocument)

  useEffect(() => {
    if (activeDocument) {
      dispatch(fetchDocument({ documentId: activeDocument.documentId, token }))
    }
  }, [activeDocument, dispatch, token])

  useEffect(() => {
    if (!open || !activeDocument) return

    setEditMode(false)
    setPromptValue(activeDocument.prompt || '')
    setTempSupportingDocs(activeDocument?.supportingDocumentIds || [])
  }, [open])

  useEffect(() => {
    if (!open) return

    // If no temp docs → clean view
    if (!tempSupportingDocs?.length) {
      dispatch(resetSupportingDocuments())
      return
    }

    dispatch(
      fetchDocuments({
        organizationId,
        projectId,
        documentIds: tempSupportingDocs,
        token,
        target: 'supportingDocuments'
      })
    )
  }, [open, tempSupportingDocs])

  useEffect(() => {
    setDialogLoading(loading || isLoading)
  }, [loading, isLoading])

  useEffect(() => {
    if (!activeDocument) return

    const PromptChanged = promptValue !== (activeDocument.prompt || '')
    const docsChanged =
      JSON.stringify(tempSupportingDocs) !== JSON.stringify(activeDocument.supportingDocumentIds || [])

    setHasBreakingChanges(PromptChanged || docsChanged)
  }, [promptValue, tempSupportingDocs, activeDocument])

  const handleSave = async () => {
    if (!activeDocument) return

    setDialogLoading(true)
    const payload = {
      id: activeDocument.id,
      taskId,
      nodeType: 'DOCUMENT',
      nodeValue: {
        documentMetadata: {
          prompt: promptValue,
          supportingDocumentIds: tempSupportingDocs
        }
      }
    }
    try {
      await dispatch(updateTaskNode({ organizationId, projectId, taskId, taskNodePayload: payload, token })).unwrap()
      toast.success('Document updated!')
      reloadAll()
      setEditMode(false)
    } catch (error) {
      console.error('Error updating document:', error)
      toast.error('Failed to update document')
    } finally {
      setDialogLoading(false)
    }
  }

  const handleAddSupportingDoc = newDocIds => {
    setTempSupportingDocs(prev => Array.from(new Set([...prev, ...newDocIds])))
    setOpenAddDocDialog(false)
  }

  const handleRemoveSupportingDoc = id => {
    setTempSupportingDocs(prev => prev.filter(docId => docId !== id))
  }

  const handleGenerateClick = () => {
    const hasGeneratedContent = activeDocument.length > 0

    if (hasGeneratedContent) {
      // Show confirmation dialog for regenerate
      setConfirmRegenerate(true)
    } else {
      // Direct generate for first time
      handleGenerate()
    }
  }

  const handleGenerate = async () => {
    if (generateSingleDocument && activeDocument) {
      try {
        setIsGenerating(true)
        setConfirmRegenerate(false)
        setShowDetails(false) // Close the config section
        setShowDocumentText(false) // Close the document text section

        await generateSingleDocument(activeDocument)

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

  const handleClose = () => {
    dispatch(resetSupportingDocuments())
    setEditMode(false)
    setFullscreen(false)
    setShowDetails(true)
    setShowDocumentText(false)
    setTempSupportingDocs([])
    onClose()
  }

  const handleCancel = () => {
    setEditMode(false)
    resetDocumentState()
  }

  const resetDocumentState = () => {
    if (!activeDocument) return
    setPromptValue(activeDocument?.prompt || '')
    setTempSupportingDocs(activeDocument?.supportingDocumentIds || [])
  }

  if (!activeDocument) {
    return null
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      disableEscapeKeyDown={false}
      disableEnforceFocus
      maxWidth={fullscreen ? false : 'lg'}
      fullWidth
      fullScreen={fullscreen}
      PaperProps={{
        sx: {
          height: fullscreen ? '100vh' : '90vh',
          bgcolor: fullscreen ? 'background.paper' : 'transparent'
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
                {activeDocument?.name || 'Document Preview'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <>
              {!editMode ? (
                <Tooltip title='Edit document details'>
                  <span>
                    <IconButton size='small' onClick={() => setEditMode(true)} disabled={editMode} sx={{ mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                  <Button variant='outlined' size='small' onClick={handleCancel}>
                    {dialogLoading ? 'Saving...' : 'Cancel'}
                  </Button>
                  <Button
                    variant='contained'
                    size='small'
                    onClick={() => {
                      if (hasBreakingChanges) {
                        setOpenConfirmAnswersDelete(true)
                      } else {
                        handleSave()
                      }
                    }}
                    disabled={dialogLoading}
                  >
                    {dialogLoading ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              )}
              {!editMode && (
                <Tooltip
                  title={
                    isGenerating
                      ? 'Generation in progress...'
                      : !isFileTypeSupported(activeDocument?.url)
                      ? 'This file format is not supported for generation'
                      : activeDocument.length > 0
                      ? 'Regenerate document answers'
                      : 'Generate document answers'
                  }
                >
                  <span>
                    <IconButton
                      size='small'
                      onClick={handleGenerateClick}
                      sx={{ mr: 1 }}
                      disabled={!isFileTypeSupported(activeDocument?.url) || isGenerating || dialogLoading}
                    >
                      {isGenerating || dialogLoading ? <CircularProgress size={20} /> : <RocketLaunchIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              {!editMode && (
                <Tooltip title='Remove document'>
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
              )}
              <Tooltip title={isExportingCsv ? 'Exporting...' : 'Export data as CSV'}>
                <span>
                  <IconButton
                    size='small'
                    onClick={() => onExportCsv(activeDocument?.id, activeDocument?.name)}
                    disabled={isExportingCsv}
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
        {/* BREAKING CHANGES WARNING */}
        {hasBreakingChanges && editMode && (
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'warning.main',
              backgroundColor: 'background.paper',
              color: 'warning.dark',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
          >
            <WarningIcon />
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              You changed the question or supporting documents. All related answers will be deleted when you save.
            </Typography>
          </Box>
        )}
        {/* Prompt Section */}
        <Paper
          elevation={0}
          sx={{
            borderBottom: 1,
            p: 2,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
            maxHeight: '70vh',
            overflowY: 'auto'
          }}
        >
          <CleanCollapse title='Document Details' open={showDetails} onToggle={() => setShowDetails(!showDetails)}>
            {/* PROMPT AREA */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  Prompt
                </Typography>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  Supporting Documents
                </Typography>
                <Tooltip title=' Supporting documents provide additional context to improve answer accuracy.'>
                  <IconButton color='primary' aria-label='info about tasks'>
                    <Icon icon='mdi:information-outline' />
                  </IconButton>
                </Tooltip>
              </Box>

              <Tooltip title={!editMode ? 'You must be in edit mode to add documents' : ''}>
                <span>
                  <Button
                    variant='outlined'
                    startIcon={<DocumentScannerIcon />}
                    onClick={() => setOpenAddDocDialog(true)}
                    sx={{ mb: 2 }}
                    disabled={!editMode}
                  >
                    Add Document
                  </Button>
                </span>
              </Tooltip>
              {/* DOCUMENT LIST */}
              <Box
                sx={{
                  maxHeight: 260,
                  overflowY: 'auto',
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))'
                }}
              >
                {supportingDocuments.map(doc => (
                  <Paper
                    key={doc.documentId}
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 120,
                      cursor: 'default',
                      transition: '0.2s',
                      backgroundColor: 'background.paper',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    {/* Header Row */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon color='primary' />
                      <Typography sx={{ fontWeight: 600, flex: 1 }}>{<TruncatedText text={doc.title} cursor='default' />}</Typography>
                    </Box>

                    {/* Footer Actions */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      {doc.id && (
                        <Button
                          variant='outlined'
                          size='small'
                          href={`http://localhost:3000/gendox/document-instance/?organizationId=${organizationId}&documentId=${doc.id}&projectId=${projectId}`}
                          target='_blank'
                          sx={{ textTransform: 'none' }}
                        >
                          Open Document
                        </Button>
                      )}
                      <Tooltip title={!editMode ? 'You must be in edit mode to remove documents' : ''}>
                        <span>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleRemoveSupportingDoc(doc.id)}
                            disabled={!editMode}
                          >
                            <DeleteOutlineIcon fontSize='small' />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          </CleanCollapse>
          <Divider sx={{ my: 1, borderColor: 'transparent' }} />

          <CleanCollapse
            title='Document Text'
            open={showDocumentText}
            onToggle={() => setShowDocumentText(!showDocumentText)}
          >
            <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
              <ResponsiveCardContent
                sx={{
                  backgroundColor: 'transparent',
                  py: 6,
                  px: 4,
                  minHeight: fullscreen ? 'calc(100vh - 200px)' : '50vh',
                  opacity: isGenerating ? 0.6 : 1,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: isGenerating ? 'none' : 'auto'
                }}
              >
                <DocumentTextComponent
                  sections={sections}
                  isBlurring={isBlurring}
                  documentId={activeDocument.documentId}
                  projectId={projectId}
                  organizationId={organizationId}
                />
                {/* <SectionCard /> */}
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
          </CleanCollapse>
        </Paper>
      </DialogContent>

      {/* Regenerate Confirmation Dialog */}
      <GenerateConfirmDialog
        open={confirmRegenerate}
        onClose={handleCancelRegenerate}
        onConfirm={handleConfirmRegenerate}
        type='document'
      />
      <AddNewDocumentDialog
        open={openAddDocDialog}
        onClose={() => setOpenAddDocDialog(false)}
        existingDocumentIds={activeDocument?.supportingDocumentIds || []}
        organizationId={organizationId}
        projectId={projectId}
        taskId={taskId}
        token={token}
        mode='supporting'
        onConfirm={newIds => handleAddSupportingDoc(newIds)}
        onUploadSuccess={newDocIds => handleAddSupportingDoc(newDocIds)}
      />

      <DeleteConfirmDialog
        open={openConfirmAnswersDelete}
        onClose={() => setOpenConfirmAnswersDelete(false)}
        onConfirm={() => {
          setHasBreakingChanges(false)
          setOpenConfirmAnswersDelete(false)
          handleSave()
        }}
        title='Confirm Document Update'
        contentText='You changed the document or its supporting documents. All related answers will be permanently deleted. Do you want to proceed?'
        confirmButtonText='Yes, continue'
        cancelButtonText='Cancel'
      />
    </Dialog>
  )
}

export default DocumentPagePreviewDialog
