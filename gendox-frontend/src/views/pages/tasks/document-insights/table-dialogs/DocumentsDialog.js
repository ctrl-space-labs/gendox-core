import React, { useEffect, useState, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
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
import UploaderDocumentInsights from './UploaderDocumentInsigths'
import { fetchProjectDocuments } from 'src/store/activeProject/activeProject'
import { useDispatch, useSelector } from 'react-redux'
import taskService from 'src/gendox-sdk/taskService'
import { fetchTaskNodesByTaskId } from 'src/store/activeTask/activeTask'

const DocumentsDialog = ({ open, onClose, organizationId, projectId, token, taskId, existingDocuments }) => {
  const dispatch = useDispatch()
  const { projectDocuments, isBlurring } = useSelector(state => state.activeProject)
  const [showUploader, setShowUploader] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocId, setSelectedDocId] = useState(null)

  const existingDocIds = useMemo(() => new Set(existingDocuments.map(doc => doc.documentId)), [existingDocuments])

  useEffect(() => {
    if (open && organizationId && projectId && token) {
      dispatch(fetchProjectDocuments({ organizationId, projectId, token }))
    }
    if (!open) {
      setSelectedDocId(null) // reset selection on close
      setSearchTerm('')
    }
  }, [open, organizationId, projectId, token, dispatch])

  const filteredDocuments = useMemo(() => {
    if (!searchTerm) return projectDocuments.content || []
    return (projectDocuments.content || []).filter(doc => doc.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm, projectDocuments])

  const handleSelect = doc => {
    setSelectedDocId(doc.id)
  }

  const handleConfirm = async () => {
    const doc = (projectDocuments.content || []).find(d => d.id === selectedDocId)
    // Now create TaskNode for this document
    const taskNodePayload = {
      taskId: taskId, // you need to pass this prop to the uploader component
      nodeType: 'DOCUMENT',
      documentId: doc.id
    }

    await taskService.createTaskNode(organizationId, projectId, taskNodePayload, token)
    // Dispatch reload of nodes/documents or just close uploader and refresh UI
    dispatch(fetchTaskNodesByTaskId({ organizationId, projectId, taskId, token }))
    onClose()
  }

  // Get selected doc details for preview info
  const selectedDoc = selectedDocId ? (projectDocuments.content || []).find(d => d.id === selectedDocId) : null

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6' component='div'>
            Select a Project Document
          </Typography>
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

          {isBlurring ? (
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
            <List
              disablePadding
              sx={{
                maxHeight: 300,
                overflowY: 'auto',
                borderRadius: 1,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              {filteredDocuments.map((doc, index) => {
                const isAlreadySelected = existingDocIds.has(doc.id)
                const createdDate = doc.createAt
                  ? new Date(doc.createAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Unknown date'

                const isSelected = doc.id === selectedDocId

                return (
                  <React.Fragment key={doc.id}>
                    <ListItemButton
                      onClick={() => !isAlreadySelected && handleSelect(doc)}
                      selected={isSelected}
                      disabled={isAlreadySelected}
                      sx={{
                        transition: 'background-color 0.3s',
                        opacity: isAlreadySelected ? 0.5 : 1, // visually show disabled
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
                      {doc.id === selectedDocId && !isAlreadySelected && <CheckCircleIcon color='primary' />}
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
            </List>
          )}

          {/* Show selected document preview/info */}
          {selectedDoc && (
            <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Typography variant='subtitle1' gutterBottom>
                Document Preview
              </Typography>
              <Typography>
                <strong>Title:</strong> {selectedDoc.title || 'Untitled Document'}
              </Typography>
              <Typography>
                <strong>Created At:</strong>{' '}
                {new Date(selectedDoc.createAt).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
              <Typography>
                <strong>File Type:</strong> {selectedDoc.fileType?.description || 'N/A'}
              </Typography>
              {/* Add more preview details if you want */}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button startIcon={<CloudUploadIcon />} variant='outlined' onClick={() => setShowUploader(true)}>
            Upload New Document
          </Button>
          <Button onClick={handleConfirm} variant='contained' disabled={!selectedDocId}>
            Confirm Selection
          </Button>
          <Button onClick={onClose}>Cancel</Button>
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
          <UploaderDocumentInsights closeUploader={() => setShowUploader(false)} taskId={taskId} onClose={onClose} />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DocumentsDialog
