import React, { useMemo, useState, useEffect } from 'react'
import { Box, Typography, Dialog, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import Icon from 'src/views/custom-components/mui/icon/icon'
import documentService from 'src/gendox-sdk/documentService'
import { downloadFromAxiosResponse } from 'src/utils/downloadFileUtils'
import toast from 'react-hot-toast'

const MessageAttachments = ({ attachments, currentThread, token }) => {
  const [openImage, setOpenImage] = useState(false)
  const [activeImage, setActiveImage] = useState(null)

  const images = useMemo(() => (attachments || []).filter(a => a.kind === 'image'), [attachments])
  const files = useMemo(() => (attachments || []).filter(a => a.kind !== 'image'), [attachments])

  console.log("files", files)

  const hadleOpenImage = img => {
    if (!img?.previewUrl) return
    setActiveImage(img)
    setOpenImage(true)
  }

  const handleCloseImage = () => {
    setOpenImage(false)
    setActiveImage(null)
  }

  const handleDownloadFile = async fileAtt => {
    const documentId = fileAtt?.documentId
    if (!documentId) return

    try {
      const res = await documentService.downloadDocument(
        currentThread?.organizationId,
        currentThread?.projectId,
        documentId,
        token
      )

      console.log('download headers:', res?.headers)
      console.log('blob type/size:', res?.data?.type, res?.data?.size, res?.data instanceof Blob)

      downloadFromAxiosResponse(res, fileAtt.title || fileAtt.name || 'document')
    } catch (e) {
      console.error('Download failed:', e)
      toast.error('Failed to download file')
    }
  }

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') handleCloseImage()
    }
    if (openImage) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openImage])

  if (!Array.isArray(attachments) || attachments.length === 0) return null

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: 'flex-end', 
            maxWidth: '80%'
          }}
        >
          {/* ✅ Images preview (like ChatGPT) */}
          {images.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {images.map(img => (
                <Box
                  key={img.documentId || img.id}
                  sx={{
                    width: 200,
                    maxWidth: '70%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                  }}
                >
                  {img.previewUrl ? (
                    <Box
                      component='img'
                      src={img.previewUrl}
                      alt={img.title || img.name || 'attachment'}
                      onClick={() => hadleOpenImage(img)}
                      sx={{
                        width: '100%',
                        height: 160,
                        objectFit: 'cover',
                        display: 'block',
                        cursor: 'pointer',
                        transition: 'transform 120ms ease, opacity 120ms ease',
                        '&:hover': { transform: 'scale(1.01)', opacity: 0.95 }
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: 160,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.7,
                        fontSize: 12
                      }}
                    >
                      Loading preview...
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* ✅ Files pill */}
          {files.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {files.map(f => (
                <Box
                  key={f.documentId || f.id}
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDownloadFile(f)
                  }}
                  role='button'
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleDownloadFile(f)
                    }
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.25,
                    py: 1,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    maxWidth: 420,
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { opacity: 0.95 }
                  }}
                  title={f.title || f.name}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: 'error.main',
                      color: 'error.contrastText',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: '0 0 auto'
                    }}
                  >
                    <Icon icon='mdi:file' />
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant='subtitle2' noWrap sx={{ fontWeight: 700 }}>
                      {f.title || f.name}
                    </Typography>
                    <Typography variant='caption' sx={{ opacity: 0.8 }} noWrap>
                  {f.documentType || 'File'}
                </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
      {/* ✅ Lightbox Dialog (ChatGPT-like) */}
      <Dialog
        open={openImage}
        onClose={handleCloseImage}
        maxWidth={false}
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none'
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(8px)', // ✅ blur
            WebkitBackdropFilter: 'blur(8px)' // for Safari
          }
        }}
      >
        {/* close button */}
        <IconButton
          onClick={handleCloseImage}
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            color: 'white',
            zIndex: 2
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* image */}
        {activeImage?.previewUrl && (
          <Box
            component='img'
            src={activeImage.previewUrl}
            alt={activeImage.title || activeImage.name || 'preview'}
            sx={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: 2,
              display: 'block'
            }}
          />
        )}
      </Dialog>
    </>
  )
}

export default MessageAttachments
