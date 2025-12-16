import React, { useState, useEffect, useRef, forwardRef } from 'react'
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Divider,
  AppBar,
  Toolbar,
  Chip,
  TextField,
  Button,
  Collapse,
  Paper,
  Tooltip,
  Checkbox,
  FormControlLabel
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import DescriptionIcon from '@mui/icons-material/Description'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DownloadIcon from '@mui/icons-material/Download'
import BlockIcon from '@mui/icons-material/Block'
import ErrorIcon from '@mui/icons-material/Error'
import GendoxMarkdownRenderer from 'src/views/pages/markdown-renderer/GendoxMarkdownRenderer'
import taskService from 'src/gendox-sdk/taskService'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/router'
import { isFileTypeSupported } from 'src/utils/tasks/taskUtils'
import GenerateConfirmDialog from 'src/utils/dialogs/GenerateConfirmDialog'
import useGenerateNewPagesGuard from 'src/views/pages/tasks/document-digitization/table-hooks/useGenerateNewPagesGuard'
import TextareaAutosizeStyled from 'src/views/pages/tasks/helping-components/TextareaAutosizeStyled'
import { updateTaskNode } from 'src/store/activeTaskNode/activeTaskNode'
import { useDispatch } from 'react-redux'

const DocumentPagePreviewDialog = ({
  open,
  onClose,
  document,
  documentPages,
  onDocumentUpdate,
  generateSingleDocument,
  dialogLoading,
  onExportCsv,
  isExportingCsv,
  onDelete
}) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [pageNodes, setPageNodes] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalElements, setTotalElements] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [showDocumentConfiguration, setShowDocumentConfiguration] = useState(true)
  const [promptValue, setPromptValue] = useState('')
  const [structureValue, setStructureValue] = useState('')
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [currentDocument, setCurrentDocument] = useState(document || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pageFrom, setPageFrom] = useState('')
  const [pageTo, setPageTo] = useState('')
  const [pageRangeError, setPageRangeError] = useState('')
  const [selectAllPages, setSelectAllPages] = useState(false)
  const sectionRefs = useRef([])
  const router = useRouter()

  const PAGE_SIZE = 20

  const docPage = Array.isArray(documentPages)
    ? documentPages.find(page => page.taskDocumentNodeId === document?.id)
    : (documentPages?.content || []).find(page => page.taskDocumentNodeId === document?.id)
  const totalPages = docPage?.documentPages || 0

  const parsedFrom = pageFrom && pageFrom.trim() ? parseInt(pageFrom, 10) : null
  const parsedTo = pageTo && pageTo.trim() ? parseInt(pageTo, 10) : null
  const allPagesFlag = selectAllPages || ((!pageFrom || pageFrom.trim() === '') && (!pageTo || pageTo.trim() === ''))

  const { requestedExceedsGeneratedSingle, generateNewDisabledSingle } = useGenerateNewPagesGuard({
    documentPages,
    singleDoc: {
      docId: currentDocument?.id,
      pageFrom: parsedFrom,
      pageTo: parsedTo,
      allPages: allPagesFlag
    }
  })

  const generateNewDisabled = generateNewDisabledSingle({
    isSupported: isFileTypeSupported(currentDocument?.url),
    hasPrompt: !!currentDocument?.prompt?.trim(),
    isGenerating,
    dialogLoading,
    pageRangeError
  })

  // Validation function for page range
  const validatePageRange = (fromPage, toPage, updateState = true) => {
    // If both are empty, it's valid (means all pages)
    if ((!fromPage || fromPage.trim() === '') && (!toPage || toPage.trim() === '')) {
      if (updateState) setPageRangeError('')
      return true
    }

    const from = fromPage && fromPage.trim() !== '' ? parseInt(fromPage, 10) : null
    const to = toPage && toPage.trim() !== '' ? parseInt(toPage, 10) : null

    // Validate individual values
    if (from !== null && (isNaN(from) || from < 1 || from > totalPages)) {
      if (updateState) setPageRangeError(`From page must be between 1 and ${totalPages}`)
      return false
    }

    if (to !== null && (isNaN(to) || to < 1 || to > totalPages)) {
      if (updateState) setPageRangeError(`To page must be between 1 and ${totalPages}`)
      return false
    }

    // If both are set, validate range
    if (from !== null && to !== null && from > to) {
      if (updateState) setPageRangeError('From page cannot be greater than To page')
      return false
    }

    if (updateState) setPageRangeError('')
    return true
  }

  // Initialize prompt and structure values from document
  useEffect(() => {
    if (document) {
      setCurrentDocument(document)
      if (open) {
        setPromptValue(document.prompt || '')
        setStructureValue(document.structure || '')
        const fromPage = document.pageFrom ? document.pageFrom.toString() : ''
        const toPage = document.pageTo ? document.pageTo.toString() : ''
        setPageFrom(fromPage)
        setPageTo(toPage)
        // Set selectAllPages to true if both pageFrom and pageTo are empty
        setSelectAllPages(document?.allPages || (!fromPage && !toPage))
      }
    }
  }, [open, document])

  // Function to fetch answer nodes with pagination
  const fetchAnswerNodes = async (page = 0, append = false) => {
    if (!open || !document?.id) return

    if (page === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    const token = window.localStorage.getItem('accessToken')
    const { organizationId, projectId, taskId } = router.query

    try {
      // Fetch task nodes for this document with ANSWER node type
      const response = await taskService.getTaskNodesByCriteria(
        organizationId,
        projectId,
        taskId,
        {
          taskId,
          nodeTypeNames: ['ANSWER'],
          nodeValueNodeDocumentId: document.id
        },
        token,
        page,
        PAGE_SIZE
      )
      const data = response.data
      const nodes = data?.content || []
      const totalElements = data?.totalElements || 0
      const totalPages = data?.totalPages || 0
      const currentPageNum = data?.pageable?.pageNumber || page

      // Filter nodes for this specific document and sort by page order (node_value.order)
      const documentAnswerNodes = nodes
        .filter(node => node.documentId === document.documentId)
        .sort((a, b) => {
          const orderA = a.nodeValue?.order || 0
          const orderB = b.nodeValue?.order || 0
          return orderA - orderB
        })

      // Update state
      if (append) {
        // Append new nodes to existing ones, avoiding duplicates
        setPageNodes(prevNodes => {
          const existingIds = new Set(prevNodes.map(node => node.id))
          const newNodes = documentAnswerNodes.filter(node => !existingIds.has(node.id))
          return [...prevNodes, ...newNodes]
        })
      } else {
        setPageNodes(documentAnswerNodes)
      }

      setCurrentPage(currentPageNum)
      setTotalElements(totalElements)
      setHasMore(currentPageNum + 1 < totalPages)

      // Don't show fallback demo content - let the empty state handle it
      if (!append && documentAnswerNodes.length === 0) {
        setPageNodes([])
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error fetching answer nodes:', error)

      if (!append) {
        // On error, show empty state - the UI will handle showing appropriate message
        setPageNodes([])
        setHasMore(false)
        toast.error('Failed to load document content. Please try again.')
      }
    } finally {
      if (page === 0) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }

  // Load more pages
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchAnswerNodes(currentPage + 1, true)
    }
  }

  // Initial fetch when dialog opens
  useEffect(() => {
    if (open && document?.id) {
      // Reset pagination state
      setCurrentPage(0)
      setHasMore(false)
      setTotalElements(0)
      fetchAnswerNodes(0, false)
    }
  }, [open, document, router.query])

  const handleClose = () => {
    if (editMode) {
      setEditMode(false)
      setPromptValue(currentDocument?.prompt || '')
      setStructureValue(currentDocument?.structure || '')
      const fromPage = currentDocument?.pageFrom ? currentDocument.pageFrom.toString() : ''
      const toPage = currentDocument?.pageTo ? currentDocument.pageTo.toString() : ''
      setPageFrom(fromPage)
      setPageTo(toPage)
      setSelectAllPages(currentDocument?.allPages || (!fromPage && !toPage))
    }
    setFullscreen(false)
    setPageNodes([])
    setCurrentPage(0)
    setHasMore(false)
    setTotalElements(0)
    onClose()
  }

  const handlePageFromChange = value => {
    setPageFrom(value)
    validatePageRange(value, pageTo)
    // If user types in page range, uncheck "select all"
    // Only uncheck if user is actually entering a value (not clearing)
    if (value && value.trim()) {
      setSelectAllPages(false)
    }
    // If both fields become empty, check "select all"
    else if ((!value || !value.trim()) && (!pageTo || !pageTo.trim())) {
      setSelectAllPages(true)
    }
  }

  const handlePageToChange = value => {
    setPageTo(value)
    validatePageRange(pageFrom, value)
    // If user types in page range, uncheck "select all"
    // Only uncheck if user is actually entering a value (not clearing)
    if (value && value.trim()) {
      setSelectAllPages(false)
    }
    // If both fields become empty, check "select all"
    else if ((!pageFrom || !pageFrom.trim()) && (!value || !value.trim())) {
      setSelectAllPages(true)
    }
  }

  const handleSelectAllPagesChange = checked => {
    setSelectAllPages(checked)
    if (checked) {
      // Clear page range when "select all" is checked
      setPageFrom('')
      setPageTo('')
      setPageRangeError('')
    }
  }

  const handleSave = async () => {
    if (!document) return

    // Validate page range before saving
    const isValid = validatePageRange(pageFrom, pageTo)
    if (!isValid) {
      toast.error('Please fix page range errors before saving')
      return
    }

    setSaving(true)
    try {
      const token = window.localStorage.getItem('accessToken')
      const { organizationId, projectId, taskId } = router.query

      const payload = {
        id: document.id,
        taskId,
        nodeType: 'DOCUMENT',
        nodeValue: {
          documentMetadata: {
            prompt: promptValue,
            structure: structureValue,
            pageFrom: pageFrom && pageFrom.trim() ? parseInt(pageFrom, 10) : null,
            pageTo: pageTo && pageTo.trim() ? parseInt(pageTo, 10) : null,
            allPages: selectAllPages || ((!pageFrom || !pageFrom.trim()) && (!pageTo || !pageTo.trim()))
          }
        }
      }

      await dispatch(updateTaskNode({ organizationId, projectId, taskId, taskNodePayload: payload, token })).unwrap()

      // Update the document object locally first
      const updatedDocument = {
        ...document,
        prompt: promptValue,
        structure: structureValue,
        pageFrom: pageFrom && pageFrom.trim() ? parseInt(pageFrom, 10) : null,
        pageTo: pageTo && pageTo.trim() ? parseInt(pageTo, 10) : null,
        allPages: payload.nodeValue.documentMetadata.allPages
      }

      // Update local state to reflect changes immediately
      setCurrentDocument(updatedDocument)

      if (onDocumentUpdate) {
        onDocumentUpdate(updatedDocument)
      }

      setEditMode(false)
      toast.success('Document updated successfully!')

      // Force re-render by updating the document reference
      // This ensures all UI elements reflect the new prompt state immediately
    } catch (error) {
      console.error('Error updating document:', error)
      toast.error('Failed to update document')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setPromptValue(currentDocument?.prompt || '')
    setStructureValue(currentDocument?.structure || '')
    const fromPage = currentDocument?.pageFrom ? currentDocument.pageFrom.toString() : ''
    const toPage = currentDocument?.pageTo ? currentDocument.pageTo.toString() : ''
    setPageFrom(fromPage)
    setPageTo(toPage)
    setSelectAllPages(currentDocument?.allPages || (!fromPage && !toPage))
    setPageRangeError('')
  }

  const handleGenerateClick = () => {
    const hasGeneratedContent = pageNodes.length > 0

    if (hasGeneratedContent) {
      // Show confirmation dialog for regenerate
      setConfirmRegenerate(true)
    } else {
      // Direct generate for first time
      handleGenerate()
    }
  }

  const handleGenerate = async () => {
    if (generateSingleDocument && currentDocument) {
      // Validate page range before generating
      const isValid = validatePageRange(pageFrom, pageTo)
      if (!isValid) {
        toast.error('Please fix page range errors before generating')
        return
      }      

      try {
        setIsGenerating(true)
        setConfirmRegenerate(false)
        setShowDocumentConfiguration(false) // Close the config section

        // Pass page range if specified
        const pageFromValue = pageFrom && pageFrom.trim() ? pageFrom : null
        const pageToValue = pageTo && pageTo.trim() ? pageTo : null

        await generateSingleDocument(currentDocument, pageFromValue, pageToValue)

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

  if (!document || !currentDocument) {
    return null
  }

  const SectionCardContent = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress size={40} />
          <Typography variant='body1' color='text.secondary'>
            Loading document content...
          </Typography>
        </Box>
      )
    }

    if (!pageNodes || pageNodes.length === 0) {
      const hasPrompt = currentDocument?.prompt && currentDocument.prompt.trim()
      const isSupported = isFileTypeSupported(currentDocument?.url)

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
            flexDirection: 'column',
            gap: 3,
            textAlign: 'center',
            px: 4
          }}
        >
          {!isSupported ? (
            <BlockIcon sx={{ fontSize: 80, color: 'grey.400' }} />
          ) : (
            <DescriptionIcon sx={{ fontSize: 80, color: 'text.disabled' }} />
          )}

          {!isSupported ? (
            <>
              <Typography variant='h5' color='text.primary' sx={{ fontWeight: 600 }}>
                Unsupported File Format
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 600 }}>
                This file format ({currentDocument?.name?.split('.').pop()?.toUpperCase()}) is not supported for
                document digitization. Supported formats include PDF, Word documents, PowerPoint presentations, and
                Excel files.
              </Typography>
              <Typography variant='body2' color='grey.600' sx={{ fontWeight: 500 }}>
                📄 Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ODT, RTF
              </Typography>
            </>
          ) : !hasPrompt ? (
            <>
              <Typography variant='h5' color='text.primary' sx={{ fontWeight: 600 }}>
                No Prompt Configured
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 600 }}>
                This document needs a prompt to generate answers. A prompt tells the AI how to process and analyze your
                document content.
              </Typography>
              <Typography variant='body2' color='info.main' sx={{ fontWeight: 500 }}>
                💡 Click the Edit button above to add a prompt and structure, then generate answers for this document.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant='h5' color='text.primary' sx={{ fontWeight: 600 }}>
                No Answers Generated
              </Typography>
              <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 600 }}>
                This document has a prompt configured but no answers have been generated yet. Use the generate function
                to process this document and create answer nodes.
              </Typography>
              <Typography variant='body2' color='success.main' sx={{ fontWeight: 500 }}>
                ✅ Prompt is ready • Click "Generate" to process this document
              </Typography>
            </>
          )}
        </Box>
      )
    }

    return (
      <Card sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
        {pageNodes.map((pageNode, index) => (
          <React.Fragment key={pageNode.id || index}>
            <CardContent
              ref={el => (sectionRefs.current[index] = el)}
              sx={{
                overflow: 'auto',
                backgroundColor: 'transparent',
                px: { xs: 2, sm: 3 },
                py: 3
              }}
            >
              <Typography
                variant='h6'
                sx={{
                  mb: 3,
                  textAlign: 'left',
                  color: 'primary.main',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <DescriptionIcon fontSize='small' />
                Page {pageNode.nodeValue?.order || index + 1}
              </Typography>

              <GendoxMarkdownRenderer
                markdownText={pageNode.nodeValue?.message || 'No answer content available for this page.'}
              />
            </CardContent>
            {index !== pageNodes.length - 1 && (
              <Divider
                sx={{
                  my: 4,
                  mx: 4,
                  width: 'calc(100% - 64px)',
                  borderWidth: '2px',
                  borderColor: 'primary.light',
                  opacity: 0.6
                }}
              />
            )}
          </React.Fragment>
        ))}

        {/* Load More Button */}
        {hasMore && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Button
              variant='outlined'
              size='large'
              onClick={handleLoadMore}
              disabled={loadingMore}
              startIcon={loadingMore ? <CircularProgress size={20} /> : null}
              sx={{
                minWidth: 200,
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2
                }
              }}
            >
              {loadingMore ? 'Loading More...' : `Load More Pages (${totalElements - pageNodes.length} remaining)`}
            </Button>
          </Box>
        )}
      </Card>
    )
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
                {currentDocument?.name || 'Document Preview'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {pageNodes.length > 0 && (
              <Chip
                label={(() => {
                  const numberOfNodePages = docPage?.numberOfNodePages || pageNodes.length
                  const documentPages = docPage?.documentPages || 0
                  const missingPages = Math.max(0, documentPages - numberOfNodePages)

                  const pagesText = numberOfNodePages === 1 ? '1 page' : `${numberOfNodePages} pages`
                  return missingPages > 0 ? `${pagesText} (${missingPages} missing)` : pagesText
                })()}
                size='small'
                color='success'
                variant='outlined'
                sx={{ mr: 1 }}
              />
            )}

            {editMode ? (
              <>
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  sx={{ mr: 1 }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant='contained'
                  size='small'
                  startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                  onClick={handleSave}
                  sx={{ mr: 2 }}
                  disabled={saving || pageRangeError !== ''}
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            ) : (
              <>
                <Tooltip
                  title={
                    !isFileTypeSupported(currentDocument?.url)
                      ? 'This file format is not supported for configuration'
                      : 'Edit prompt and structure'
                  }
                >
                  <span>
                    <IconButton
                      onClick={() => setEditMode(true)}
                      size='small'
                      sx={{ mr: 1 }}
                      disabled={!isFileTypeSupported(currentDocument?.url)}
                    >
                      <EditIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  title={
                    isGenerating
                      ? 'Generation in progress...'
                      : !isFileTypeSupported(currentDocument?.url)
                      ? 'This file format is not supported for generation'
                      : !currentDocument.prompt?.trim()
                      ? 'Add a prompt first to generate answers'
                      : pageRangeError !== ''
                      ? `Fix page range error: ${pageRangeError}`
                      : pageNodes.length > 0
                      ? 'Regenerate document answers'
                      : 'Generate document answers'
                  }
                >
                  <span>
                    <IconButton
                      size='small'
                      onClick={handleGenerateClick}
                      sx={{ mr: 1 }}
                      disabled={
                        !isFileTypeSupported(currentDocument?.url) ||
                        !currentDocument.prompt?.trim() ||
                        isGenerating ||
                        dialogLoading ||
                        pageRangeError !== ''
                      }
                    >
                      {isGenerating || dialogLoading ? <CircularProgress size={20} /> : <RocketLaunchIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip
                  title={
                    !isFileTypeSupported(currentDocument?.url)
                      ? 'This file format is not supported for generation'
                      : !currentDocument.prompt?.trim()
                      ? 'Add a prompt first to generate answers'
                      : pageRangeError !== ''
                      ? `Fix page range error: ${pageRangeError}`
                      : !requestedExceedsGeneratedSingle
                      ? 'All selected pages have been generated'
                      : 'Generate NEW pages'
                  }
                >
                  <span>
                    <IconButton size='small' onClick={handleGenerate} sx={{ mr: 1 }} disabled={generateNewDisabled}>
                      {isGenerating || dialogLoading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                    </IconButton>
                  </span>
                </Tooltip>{' '}
                <Tooltip title='Remove document'>
                  <span>
                    <IconButton
                      size='small'
                      onClick={() => onDelete && onDelete()}
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
            )}

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
        {/* Prompt and Structure Section */}
        <Paper
          elevation={0}
          sx={{
            borderBottom: 1,
            p: 2,
            borderColor: 'divider',
            backgroundColor: 'background.paper'
          }}
        >
          <Box sx={{ py: 3, px: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant='h6' color='text.primary' sx={{ fontWeight: 600 }}>
                  Document Configuration
                </Typography>

                {/* Status chips */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {/* File Type Status Chip - Always show if unsupported */}
                  {!isFileTypeSupported(currentDocument?.url) && (
                    <Chip
                      icon={<BlockIcon sx={{ fontSize: '0.875rem' }} />}
                      label='Unsupported Format'
                      size='small'
                      color='default'
                      variant='filled'
                      sx={{
                        fontSize: '0.75rem',
                        height: 24,
                        fontWeight: 500,
                        backgroundColor: 'grey.400',
                        color: 'white'
                      }}
                    />
                  )}

                  {/* Prompt Status Chip - Always show for supported files */}
                  {isFileTypeSupported(currentDocument?.url) &&
                    (currentDocument?.prompt && currentDocument.prompt.trim() ? (
                      <Chip
                        icon={<AutoAwesomeIcon sx={{ fontSize: '0.875rem' }} />}
                        label='Prompt'
                        size='small'
                        color='primary'
                        variant='filled'
                        sx={{
                          fontSize: '0.75rem',
                          height: 24,
                          fontWeight: 500
                        }}
                      />
                    ) : (
                      <Chip
                        label='No Prompt'
                        size='small'
                        color='warning'
                        variant='outlined'
                        sx={{
                          fontSize: '0.75rem',
                          height: 24,
                          fontWeight: 500
                        }}
                      />
                    ))}

                  {/* Generation Status Chip - Always show generation status for supported files */}
                  {isFileTypeSupported(currentDocument?.url) &&
                    (pageNodes.length > 0 ? (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: '0.875rem' }} />}
                        label='Generated'
                        size='small'
                        color='success'
                        variant='filled'
                        sx={{
                          fontSize: '0.75rem',
                          height: 24,
                          fontWeight: 500
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<ErrorIcon sx={{ fontSize: '0.875rem' }} />}
                        label='Not Generated'
                        size='small'
                        color='error'
                        variant='filled'
                        sx={{
                          fontSize: '0.75rem',
                          height: 24,
                          fontWeight: 500
                        }}
                      />
                    ))}

                  {/* Structure Status Chip - Always show structure status for supported files */}
                  {isFileTypeSupported(currentDocument?.url) &&
                    (currentDocument?.structure && currentDocument.structure.trim() ? (
                      <Chip
                        icon={<AccountTreeIcon sx={{ fontSize: '0.875rem' }} />}
                        label='Structure'
                        size='small'
                        color='info'
                        variant='filled'
                        sx={{
                          fontSize: '0.75rem',
                          height: 24,
                          fontWeight: 500
                        }}
                      />
                    ) : (
                      <Chip
                        label='No Structure'
                        size='small'
                        color='default'
                        variant='outlined'
                        sx={{
                          fontSize: '0.75rem',
                          height: 24,
                          fontWeight: 500
                        }}
                      />
                    ))}
                </Box>
              </Box>

              <IconButton size='small' onClick={() => setShowDocumentConfiguration(!showDocumentConfiguration)}>
                {showDocumentConfiguration ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>

            <Collapse in={showDocumentConfiguration}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2, fontWeight: 500 }}>
                    Prompt
                  </Typography>
                  {editMode ? (
                    <TextareaAutosizeStyled
                      value={promptValue}
                      onChange={e => setPromptValue(e.target.value)}
                      placeholder='Enter the prompt for document processing...'
                      minRows={3}
                      autoFocus
                    />
                  ) : (
                    <Typography
                      variant='body2'
                      color='text.primary'
                      sx={{
                        p: 2,
                        backgroundColor: 'action.hover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        minHeight: 40,
                        maxHeight: '30vh',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      {promptValue || 'No prompt specified'}
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2, fontWeight: 500 }}>
                    Structure
                  </Typography>
                  {editMode ? (
                    <TextareaAutosizeStyled
                      value={structureValue}
                      onChange={e => setStructureValue(e.target.value)}
                      placeholder='Enter the structure for document processing...'
                      minRows={2}
                      maxRows={6}
                    />
                  ) : (
                    <Typography
                      variant='body2'
                      color='text.primary'
                      sx={{
                        p: 2,
                        backgroundColor: 'action.hover',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        minHeight: 40,
                        maxHeight: '30vh',
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere'
                      }}
                    >
                      {structureValue || 'No structure specified'}
                    </Typography>
                  )}
                </Box>

                {/* Page Range Selection */}
                <Box>
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 2, fontWeight: 500 }}>
                    Page Range (optional)
                  </Typography>

                  {/* Select All Pages Checkbox */}
                  {editMode && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectAllPages}
                          onChange={e => handleSelectAllPagesChange(e.target.checked)}
                          size='small'
                          disabled={false}
                        />
                      }
                      label='Select all pages'
                      sx={{ mb: 3 }}
                    />
                  )}

                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <TextField
                      size='small'
                      variant='outlined'
                      label='From Page'
                      type='number'
                      value={pageFrom}
                      onChange={e => handlePageFromChange(e.target.value)}
                      onBlur={() => validatePageRange(pageFrom, pageTo)}
                      placeholder='1'
                      inputProps={{ min: 1, max: totalPages }}
                      error={pageRangeError !== '' && pageFrom && pageFrom.trim() !== ''}
                      sx={{
                        width: 120,
                        backgroundColor: editMode ? 'background.default' : 'action.hover'
                      }}
                      disabled={!editMode || selectAllPages}
                    />
                    <Typography variant='body2' color='text.secondary'>
                      to
                    </Typography>
                    <TextField
                      size='small'
                      variant='outlined'
                      label='To Page'
                      type='number'
                      value={pageTo}
                      onChange={e => handlePageToChange(e.target.value)}
                      onBlur={() => validatePageRange(pageFrom, pageTo)}
                      placeholder={totalPages.toString()}
                      inputProps={{ min: 1, max: totalPages }}
                      error={pageRangeError !== '' && pageTo && pageTo.trim() !== ''}
                      sx={{
                        width: 120,
                        backgroundColor: editMode ? 'background.default' : 'action.hover'
                      }}
                      disabled={!editMode || selectAllPages}
                    />
                    <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                      (Total: {totalPages} pages)
                    </Typography>
                  </Box>
                  {pageRangeError && (
                    <Typography variant='body2' color='error.main' sx={{ mt: 2, fontSize: '0.75rem' }}>
                      {pageRangeError}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Collapse>
          </Box>
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
            <SectionCardContent />
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
    </Dialog>
  )
}

export default DocumentPagePreviewDialog
