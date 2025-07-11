import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch } from 'react-redux'

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

const FileListWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  maxHeight: '10rem',
  overflowY: 'auto',
  marginTop: '0.5rem'
}))

// Removed backgroundColor so the FileItem has no background.
const FileEntry = styled(ListItem)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '0.5rem',
  borderRadius: theme.shape.borderRadius,
  marginBottom: '0.5rem',
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

const UploaderDocumentInsights = ({ closeUploader, taskId, onClose }) => {
  const router = useRouter()
  const dispatch = useDispatch()
  const { organizationId, projectId } = router.query
  const accessToken = window.localStorage.getItem(localStorageConstants.accessTokenKey)

  // Media query: check if we are in mobile view
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Local state to track file, the global upload counter, and upload state.
  const [fileQueue, setFileQueue] = useState([])
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)

  const {
    getRootProps,
    getInputProps,
    open: triggerFileSelect
  } = useDropzone({
    onDrop: acceptedFiles => {
      const enrichedFiles = acceptedFiles.map(file => ({
        id: `${Date.now()}-${file.name}`,
        file,
        name: file.name,
        size: file.size
      }))
      setFileQueue(prev => [...prev, ...enrichedFiles])
    },
    noClick: true,
    noKeyboard: true,
    multiple: true
  })

  const uploadFilesBatch = async filesBatch => {
    const tasks = filesBatch.map(async fileObj => {
      const formPayload = new FormData()
      formPayload.append('file', fileObj.file)
      try {
        const uploadResponse = await documentService.uploadSingleDocument(
          organizationId,
          projectId,
          fileObj.file,
          accessToken
        )

        // Create task node for each uploaded document
        const taskNodePayload = {
          taskId,
          nodeType: 'DOCUMENT',
          documentId: uploadResponse.data.id
        }
        await taskService.createTaskNode(organizationId, projectId, taskNodePayload, accessToken)

        setUploadedCount(prev => prev + 1)
      } catch (error) {
        console.error(`Error uploading ${fileObj.name}:`, error)
      }
    })
    await Promise.all(tasks)
  }

  const handleUploadAll = async () => {
    if (!fileQueue.length) return
    setIsUploading(true)
    setTotalFiles(fileQueue.length)
    setUploadedCount(0)

    const batchSize = 5
    for (let i = 0; i < fileQueue.length; i += batchSize) {
      const batch = fileQueue.slice(i, i + batchSize)
      await uploadFilesBatch(batch)
    }

    setIsUploading(false)
    setAlertVisible(true)
    setFileQueue([])
    closeUploader()
    onClose()

    dispatch(fetchTaskNodesByTaskId({ organizationId, projectId, taskId, token: accessToken }))
  }

  const deleteFile = fileId => {
    setFileQueue(prev => prev.filter(file => file.id !== fileId))
  }

  const clearAllFiles = () => {
    setFileQueue([])
  }

  const dismissAlert = () => {
    setAlertVisible(false)
  }

  const globalProgress = totalFiles > 0 ? (uploadedCount / totalFiles) * 100 : 0

  return (
    <ModalWrapper>
      <HeaderBar>
        <Typography variant='h5' sx={{ flexGrow: 1 }}>
          Upload Documents
        </Typography>
        <IconButton onClick={closeUploader} aria-label='close' sx={{ color: 'primary.main' }}>
          <Icon icon='mdi:close' />
        </IconButton>
      </HeaderBar>

      {!isMobile && (
        <DropZoneArea {...getRootProps()} onClick={triggerFileSelect}>
          <input {...getInputProps()} />
          <Box sx={{ color: 'primary.main', mb: '1rem', pointerEvents: 'none' }}>
            <Icon icon='mdi:cloud-upload' width='12.5rem' />
          </Box>
          <Typography variant='h5' sx={{ mb: '0.5rem', pointerEvents: 'none' }}>
            Drag and Drop files here
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            or click to select files
          </Typography>
        </DropZoneArea>
      )}

      {isMobile && <input {...getInputProps()} style={{ display: 'none' }} />}

      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', my: '1.5rem' }}>
        <Button
          variant='contained'
          onClick={triggerFileSelect}
          sx={{ backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.light' } }}
        >
          CHOOSE FILES
        </Button>
      </Box>

      <Typography variant='body2' color='text.secondary' sx={{ mb: '1rem' }}>
        Maximum file size 100MB each
      </Typography>

      {fileQueue.length > 0 && (
        <>
          {isUploading && (
            <Box sx={{ width: '100%', mb: '1rem' }}>
              <Typography variant='body2'>{`Uploaded ${uploadedCount} of ${totalFiles} files`}</Typography>
              <LinearProgress variant='determinate' value={globalProgress} />
            </Box>
          )}

          <FileListWrapper>
            <List>
              {fileQueue.map(file => (
                <FileItem key={file.id} file={file} onDelete={deleteFile} />
              ))}
            </List>
          </FileListWrapper>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: '1rem', mt: '1rem' }}>
            <Button variant='outlined' color='error' onClick={clearAllFiles} disabled={isUploading}>
              Remove All
            </Button>
            <Button variant='contained' onClick={handleUploadAll} disabled={isUploading}>
              Upload Files
            </Button>
          </Box>
        </>
      )}

      <Snackbar open={alertVisible} autoHideDuration={6000} onClose={dismissAlert}>
        <Alert onClose={dismissAlert} severity='success' sx={{ width: '100%' }}>
          All files uploaded successfully!
        </Alert>
      </Snackbar>
    </ModalWrapper>
  )
}

export default UploaderDocumentInsights
