import React, { useEffect, useState, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  Box
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import UploaderDocumentDigitization from 'src/views/pages/tasks/document-digitization/table-dialogs/DocumentDigitizationUploaderDocumentDigitization'
import { fetchProjectDocuments } from 'src/store/activeProject/activeProject'
import { useDispatch, useSelector } from 'react-redux'

const DocumentsAddNewDialog = ({
  open,
  onClose,
  existingDocuments,
  loading,
  onConfirm,
  organizationId,
  projectId,
  token,
  taskId
}) => {
  const dispatch = useDispatch()
  const { projectDocuments, isBlurring } = useSelector(state => state.activeProject)
  const [documents, setDocuments] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [showUploader, setShowUploader] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocIds, setSelectedDocIds] = useState(new Set())

  const existingDocIds = useMemo(() => new Set(existingDocuments.map(doc => doc.documentId)), [existingDocuments])

  useEffect(() => {
    if (!open) {
      setSelectedDocIds(new Set())
      setSearchTerm('')
      setShowUploader(false)
      setPage(0)
    }
  }, [open])

  useEffect(() => {
    if (open && organizationId && projectId && token) {
      dispatch(fetchProjectDocuments({ organizationId, projectId, token, page }))
    }
  }, [open, organizationId, projectId, token, page, dispatch])

  useEffect(() => {
    if (projectDocuments?.content) {
      if (page === 0) {
        setDocuments(projectDocuments.content)
      } else {
        setDocuments(prev => [...prev, ...projectDocuments.content])
      }
      setTotalPages(projectDocuments.totalPages || 1)
    }
  }, [projectDocuments, page])

  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return documents
    return documents.filter(doc => doc.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm, documents])

  // Handlers
  const handleToggleSelect = doc => {
    if (existingDocIds.has(doc.id)) return
    setSelectedDocIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(doc.id)) newSet.delete(doc.id)
      else newSet.add(doc.id)
      return newSet
    })
  }

  const handleLoadMore = () => {
    if (projectDocuments && page + 1 < projectDocuments.totalPages) {
      setPage(prev => prev + 1)
    }
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selectedDocIds))
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
        <DialogTitle
          sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}
        >
          Select Project Documents
          <IconButton onClick={onClose} size='small' aria-label='close'>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 1, display: 'flex', flexDirection: 'column' }}>
          <TextField
            fullWidth
            size='small'
            variant='outlined'
            placeholder='Search documents...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          {isBlurring || loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredDocuments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <DescriptionOutlinedIcon sx={{ fontSize: 60, mb: 1 }} color='disabled' />
              <Typography>No documents found</Typography>
              <Typography variant='body2' color='text.secondary'>
                Try uploading a new document or adjust your search.
              </Typography>
            </Box>
          ) : (
            <>
              <List
                disablePadding
                sx={{
                  maxHeight: 300,
                  overflowY: 'auto',
                  borderRadius: 1,
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {filteredDocuments.map((doc, index) => {
                  const isAlreadySelected = existingDocIds.has(doc.id)
                  const isSelected = selectedDocIds.has(doc.id)
                  const createdDate = doc.createAt
                    ? new Date(doc.createAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Unknown date'
                  return (
                    <React.Fragment key={doc.id}>
                      <ListItemButton
                        onClick={() => handleToggleSelect(doc)}
                        selected={isSelected}
                        disabled={isAlreadySelected}
                        sx={{
                          transition: 'background-color 0.3s',
                          opacity: isAlreadySelected ? 0.5 : 1,
                          cursor: isAlreadySelected ? 'not-allowed' : 'pointer',
                          '&.Mui-selected': {
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                            '& .MuiListItemText-primary': { fontWeight: 'bold' }
                          }
                        }}
                      >
                        <ListItemText
                          primary={doc.title || 'Untitled Document'}
                          secondary={`Created at: ${createdDate}`}
                        />
                        {isSelected && !isAlreadySelected && <CheckCircleIcon color='primary' />}
                        {isAlreadySelected && (
                          <Typography variant='caption' color='error' sx={{ ml: 2 }}>
                            Already selected
                          </Typography>
                        )}
                      </ListItemButton>
                      {index < filteredDocuments.length - 1 && <Divider component='li' />}
                    </React.Fragment>
                  )
                })}
                {projectDocuments && page + 1 < projectDocuments.totalPages && (
                  <>
                    <Divider component='li' />
                    <ListItemButton
                      sx={{
                        justifyContent: 'center',
                        py: 1.5,
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                      onClick={handleLoadMore}
                    >
                      <Button
                        variant='outlined'
                        sx={{ width: '100%', maxWidth: 200, mx: 'auto', fontWeight: 'bold' }}
                        startIcon={isBlurring ? <CircularProgress size={16} /> : null}
                      >
                        Load More
                      </Button>
                    </ListItemButton>
                  </>
                )}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button startIcon={<CloudUploadIcon />} variant='outlined' onClick={() => setShowUploader(true)}>
            Upload New Document
          </Button>
          <Button onClick={handleConfirm} variant='contained' disabled={selectedDocIds.size === 0}>
            Confirm Selection
          </Button>
          <Button variant='outlined' onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      {/* Nested uploader modal */}
      <Dialog
        open={showUploader}
        onClose={() => setShowUploader(false)}
        fullWidth
        maxWidth='sm'
        PaperProps={{ sx: { p: 3, maxHeight: '80vh', overflowY: 'auto' } }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6' component='div'>
            Upload Document
          </Typography>
          <IconButton onClick={() => setShowUploader(false)} size='small' aria-label='close'>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <UploaderDocumentDigitization
            closeUploader={() => setShowUploader(false)}
            taskId={taskId}
            onClose={onClose}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
export default DocumentsAddNewDialog
