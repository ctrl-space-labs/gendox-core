import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Paper,
  Box,
  InputBase,
  Typography,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { sendMessage } from 'src/store/chat/gendoxChat'
import { useIFrameMessageManager } from '../../../../authentication/context/IFrameMessageManagerContext'
import AttachmentsRow from './attachments/AttachmentsRow'
import { createPasteHandler } from './attachments/attachmentUtils'
import InputMessageOptions from './input-options/InputMessageOptions'
import {
  enqueueFiles,
  uploadQueuedAttachments,
  removeLocalOnly,
  deleteUploadedAttachment,
  clearAll
} from 'src/store/chatAttachments/chatAttachments'
import CircularProgress from '@mui/material/CircularProgress'

const ChatInputSection = ({ auth, token, currentThread, organizationId, projectId, isSending, isLoadingMessages }) => {
  const iFrameMessageManager = useIFrameMessageManager()
  const dispatch = useDispatch()

  // Message text
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [plusMenuAnchorEl, setPlusMenuAnchorEl] = useState(null)
  const isPlusMenuOpen = Boolean(plusMenuAnchorEl)

  const { items: attachments, isUploading, isDeleting } = useSelector(state => state.chatAttachments)

  // uploaded docs
  const uploadedDocs = useMemo(
    () => attachments.filter(a => a.status === 'uploaded').map(a => a.uploadedDoc),
    [attachments]
  )

  const fileInputRef = useRef(null)

  const toItems = files =>
    files.map(file => {
      const isImage = file.type?.startsWith('image/')
      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
        file,
        isImage,
        previewUrl: isImage ? URL.createObjectURL(file) : null,
        status: 'queued',
        error: null,
        uploadedDoc: null
      }
    })

  const addFiles = filesList => {
    const files = Array.from(filesList || [])
    if (!files.length) return

    const newItems = toItems(files)

    // 1) into Redux
    dispatch(enqueueFiles(newItems))

    // 2) upload immediately those that just got added
    dispatch(
      uploadQueuedAttachments({ items: newItems, threadId: currentThread.threadId, organizationId, projectId, token })
    )
  }

  const handlePaste = createPasteHandler(addFiles)

  const removeAttachment = attachmentId => {
    const item = attachments.find(a => a.id === attachmentId)
    if (!item) return

    // if already uploaded -> delete from server and then remove from redux
    if (item.uploadedDoc?.documentId) {
      dispatch(
        deleteUploadedAttachment({
          attachmentId,
          documentId: item.uploadedDoc.documentId,
          organizationId,
          threadId: currentThread.threadId,
          token
        })
      )
    } else {
      // if local only, just remove from redux
      dispatch(removeLocalOnly(attachmentId))
    }
  }

  // Cleanup on unmount
  const attachmentsRef = useRef([])
  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  // Clear attachments when switching thread
  useEffect(() => {
    // when thread changes
    dispatch(clearAll())
  }, [currentThread?.threadId, dispatch])

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach(a => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
      })
    }
  }, [])

  const handlePickFiles = () => fileInputRef.current?.click()

  const handleFileInputChange = e => {
    addFiles(e.target.files)
    // reset input so selecting same file again works
    e.target.value = ''
  }

  // Send message logic
  const handleSend = () => {
    if (isSending) return
    if (isUploading || isDeleting) return
    if (!message.trim() && uploadedDocs.length === 0) return

    dispatch(
      sendMessage({
        user: auth.user,
        currentThread,
        message,
        uploadedDocs: uploadedDocs,
        organizationId,
        iFrameMessageManager,
        token
      })
    )

    setMessage('')
    // clear attachments after sending
    dispatch(clearAll())
  }

  // Drag & Drop handlers
  const onDragEnter = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  const onDragOver = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  const onDragLeave = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  const onDrop = e => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const dt = e.dataTransfer
    if (dt?.files?.length) addFiles(dt.files)
  }

  // menu items handlers
  const openPlusMenu = event => setPlusMenuAnchorEl(event.currentTarget)
  const closePlusMenu = () => setPlusMenuAnchorEl(null)
  const handleAttachFromDevice = () => {
    closePlusMenu()
    handlePickFiles() // fileInputRef.current.click()
  }

  return (
    <Paper
      elevation={3}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column', // Stack rows
        backgroundColor: 'background.paper',
        borderRadius: 2,
        gap: 1.5,
        filter: isLoadingMessages ? 'blur(6px)' : 'none',
        outline: isDragging ? '2px dashed' : 'none',
        outlineColor: isDragging ? 'primary.main' : 'transparent',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        multiple
        // you can customize accepted file types here
        // accept="image/*,.pdf,.txt,.md"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />
      {/* Attachments preview row (like ChatGPT squares) */}
      {attachments.length > 0 && (
        <Box sx={{ position: 'relative' }}>
          {/* only attachments row, no need to blur the whole input when uploading */}
          <AttachmentsRow attachments={attachments} onRemove={removeAttachment} />
        </Box>
      )}{' '}
      {/* Input row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          filter: isLoadingMessages ? 'blur(6px)' : 'none'
        }}
      >
        {/* Plus button to open menu */}
        <IconButton onClick={openPlusMenu} disabled={isSending}>
          <Icon icon='mdi:plus' />
        </IconButton>

        <Menu
          anchorEl={plusMenuAnchorEl}
          open={isPlusMenuOpen}
          onClose={closePlusMenu}
          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          PaperProps={{
            sx: {
              mt: 1,
              borderRadius: 3,
              minWidth: 320,
              overflow: 'hidden',
              boxShadow: 6,
              border: '1px solid',
              borderColor: 'divider',
              '& .MuiMenuItem-root': {
                py: 1.25
              }
            }
          }}
        >
          <MenuItem onClick={handleAttachFromDevice}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon icon='mdi:paperclip' />
            </ListItemIcon>

            <ListItemText
              primary='Add photos & files'
              secondary='Upload from your device'
              primaryTypographyProps={{ fontWeight: 600 }}
              secondaryTypographyProps={{ noWrap: true, sx: { opacity: 0.8 } }}
            />
          </MenuItem>

          <MenuItem disabled>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon icon='mdi:google-drive' />
            </ListItemIcon>

            <ListItemText
              primary='Upload from Google Drive'
              secondary='Coming soon'
              primaryTypographyProps={{ fontWeight: 600 }}
              secondaryTypographyProps={{ sx: { opacity: 0.7 } }}
            />
          </MenuItem>

          <Divider sx={{ my: 0.5 }} />

          <MenuItem disabled>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Icon icon='mdi:dots-horizontal' />
            </ListItemIcon>

            <ListItemText
              primary='More tools'
              secondary='Coming soon'
              primaryTypographyProps={{ fontWeight: 600 }}
              secondaryTypographyProps={{ sx: { opacity: 0.7 } }}
            />
          </MenuItem>
        </Menu>

        <InputBase
          placeholder='Ask anything...'
          multiline
          maxRows={4}
          fullWidth
          value={message}
          onChange={e => setMessage(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (!isUploading && !isDeleting) handleSend()
            }
          }}
        />

        {/* Send button (icon) */}
        <IconButton onClick={handleSend} disabled={isSending || isUploading || isDeleting}>
          {isSending || isUploading || isDeleting ? <CircularProgress size={20} /> : <Icon icon='mdi:send' />}
        </IconButton>
      </Box>
      {/* Drag overlay text */}
      {isDragging && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: 2,
            bgcolor: 'rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <Typography variant='subtitle1'>Drop files to attach</Typography>
        </Box>
      )}
      {/* Row 2: Search, Attach, Copilot, More chips */}
      <InputMessageOptions />
    </Paper>
  )
}

export default ChatInputSection
