import React, { Fragment, useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'

import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Button from '@mui/material/Button'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import LinearProgress from '@mui/material/LinearProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { styled, useTheme } from '@mui/material/styles'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { useDropzone } from 'react-dropzone'
import { localStorageConstants } from 'src/utils/generalConstants'
import documentService from 'src/gendox-sdk/documentService'
import useMediaQuery from '@mui/material/useMediaQuery'
import { fetchTaskNodesByTaskId } from 'src/store/activeTask/activeTask'
import taskService from 'src/gendox-sdk/taskService'

// Styled containers using rem units
const ModalWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '1rem',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '0.5rem',
  minWidth: '20rem',
  width: '100%',
  maxWidth: '90vw', // Ensure modal doesn't exceed viewport width on mobile
  maxHeight: '90vw' // Ensure modal doesn't exceed viewport width on mobile
}))

const HeaderBar = styled(Box)(({ theme }) => ({
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 0.25rem',
  marginBottom: '1rem'
}))

const DropZoneArea = styled(
  React.forwardRef(function DropZoneArea(props, ref) {
    return <div ref={ref} {...props} />
  })
)(({ theme }) => ({
  width: '100%',
  minHeight: '6rem', // ~100px
  padding: '1rem',
  border: '2px dashed',
  borderColor: theme.palette.primary.main,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  marginBottom: '1rem'
}))

// Removed backgroundColor so the FileItem has no background.
const FileEntry = styled(ListItem)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '0.5rem',
  borderRadius: theme.shape.borderRadius,
  marginBottom: '0.5rem',
  width: '100%'
}))

const FileDetails = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%'
}))

// Renders an individual file preview with details (no per-file progress bar anymore)
const FileItem = ({ file, onDelete }) => {
  const sizeInKB = file.size / 1024
  const displaySize = sizeInKB > 1000 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeInKB.toFixed(1)} KB`

  return (
    <FileEntry>
      <FileDetails>
        <Box sx={{ mr: '1rem' }}>
          <Icon icon='mdi:file-document-outline' />
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            sx={{
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis' // Long filenames end with "..."
            }}
          >
            {file.name}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {displaySize}
          </Typography>
        </Box>
        <IconButton onClick={() => onDelete(file.id)} aria-label='delete file'>
          <Icon icon='mdi:delete-outline' fontSize='1.25rem' />
        </IconButton>
      </FileDetails>
    </FileEntry>
  )
}

const UploaderDocumentInsights = ({ closeUploader, taskId }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { organizationId, projectId } = router.query
  const accessToken = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  // Media query: check if we are in mobile view
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Local state to track file, the global upload counter, and upload state.
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  // Set up the dropzone – files dropped are appended to the fileQueue with a unique id.
  const {
    getRootProps,
    getInputProps,
    open: triggerFileSelect
  } = useDropzone({
    multiple: false,
    onDrop: acceptedFiles => {
      if (acceptedFiles.length === 0) return
      setFile(acceptedFiles[0])
      setUploaded(false)
    },
    noClick: true,
    noKeyboard: true
  })

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    try {
      const uploadResponse = await documentService.uploadSingleDocument(organizationId, projectId, file, accessToken)

      // Now create TaskNode for this document
      const taskNodePayload = {
        taskId: taskId, // you need to pass this prop to the uploader component
        nodeType: 'DOCUMENT',
        documentId: uploadResponse.data.id
      }

      await taskService.createTaskNode(organizationId, projectId, taskNodePayload, accessToken)

      // Dispatch reload of nodes/documents or just close uploader and refresh UI
      dispatch(fetchTaskNodesByTaskId({ organizationId, projectId, taskId, token: accessToken }))

      setAlertVisible(true)
      setFile(null)
      closeUploader()
    } catch (error) {
      console.error('Upload or TaskNode creation error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = () => {
    setFile(null)
    setUploaded(false)
  }

  // Close the success alert.
  const dismissAlert = () => {
    setAlertVisible(false)
  }

  return (
    <ModalWrapper>
      <HeaderBar>
        <Typography variant='h5' sx={{ flexGrow: 1 }}>
          Upload Document
        </Typography>
        <IconButton onClick={closeUploader} aria-label='close' sx={{ color: 'primary.main' }}>
          <Icon icon='mdi:close' />
        </IconButton>
      </HeaderBar>

      {/* Render drag-and-drop only on non-mobile devices */}
      {!isMobile && (
        <DropZoneArea {...getRootProps()} onClick={triggerFileSelect}>
          {/* Always include the file input element */}
          <input {...getInputProps()} />
          <Box sx={{ color: 'primary.main', mb: '1rem', pointerEvents: 'none' }}>
            <Icon icon='mdi:cloud-upload' width='12.5rem' /> {/* ~200px */}
          </Box>
          <Typography variant='h5' sx={{ mb: '0.5rem', pointerEvents: 'none' }}>
            Drag and Drop
          </Typography>
        </DropZoneArea>
      )}

      {/* On mobile, you can still include the hidden input if needed */}
      {isMobile && <input {...getInputProps()} style={{ display: 'none' }} />}

      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', my: '1.5rem' }}>
        <Button
          variant='contained'
          onClick={triggerFileSelect}
          disabled={!!file}
          sx={{ backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.light' } }}
        >
          CHOOSE FILE
        </Button>
      </Box>

      <Typography variant='body2' color='text.secondary' sx={{ mb: '1rem' }}>
        Maximum file size 100MB
      </Typography>

      {file && (
        <>
          {/* Global progress bar above the file list */}
          {isUploading && (
            <Box sx={{ width: '100%', mb: '1rem' }}>
              <Typography variant='body2'>Uploading file...</Typography>
              <LinearProgress />
            </Box>
          )}

          <FileItem file={file} onDelete={handleDelete} />
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: '1rem', mt: '1rem' }}>
            <Button variant='contained' onClick={handleUpload} disabled={isUploading}>
              Upload File
            </Button>
          </Box>
        </>
      )}

      <Snackbar open={alertVisible} autoHideDuration={6000} onClose={dismissAlert}>
        <Alert onClose={dismissAlert} severity='success' sx={{ width: '100%' }}>
          File uploaded successfully!
        </Alert>
      </Snackbar>
    </ModalWrapper>
  )
}

export default UploaderDocumentInsights
