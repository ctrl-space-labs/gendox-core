import { useState, useEffect } from 'react'
import { Box, IconButton, CircularProgress, Skeleton, Dialog } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import Icon from 'src/views/custom-components/mui/icon/icon'

const AttachmentImageTile = ({ attachment, onRemove }) => {
  const { id, previewUrl, file } = attachment
  const isUploading = attachment.status === 'uploading'
  const isDeleting = attachment.status === 'deleting'
  const isBusy = isUploading || isDeleting

  const [openImage, setOpenImage] = useState(false)

  const handleOpenImage = () => {
    if (!previewUrl || isBusy) return
    setOpenImage(true)
  }

  const handleCloseImage = () => {
    setOpenImage(false)
  }

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape') handleCloseImage()
    }
    if (openImage) window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openImage])

  return (
    <>
      {/* Thumbnail */}
      <Box
        onClick={handleOpenImage}
        sx={{
          width: 56,
          height: 56,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          flex: '0 0 auto',
          backgroundImage: `url(${previewUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          cursor: isBusy ? 'default' : 'pointer', // ✅ hand cursor
          '&:hover .removeBtn': { opacity: 1 },
          ...(isUploading && { opacity: 0.92 }),
          ...(isDeleting && { opacity: 0.65, filter: 'blur(1px) grayscale(0.35)' })
        }}
        title={file?.name}
      >
        {/* Remove button */}
        <IconButton
          className='removeBtn'
          size='small'
          disabled={isBusy}
          onClick={e => {
            e.stopPropagation() // ✅ prevent dialog open
            onRemove(id)
          }}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 22,
            height: 22,
            opacity: 0,
            transition: 'opacity 120ms ease',
            bgcolor: 'rgba(0,0,0,0.45)',
            color: '#fff',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
            ...(isBusy && { opacity: 0 })
          }}
        >
          <Icon icon='mdi:close' />
        </IconButton>

        {/* Upload shimmer */}
        {isUploading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              bgcolor: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box sx={{ width: '70%', borderRadius: 2, overflow: 'hidden' }}>
              <Skeleton variant='rectangular' width='100%' height={10} />
            </Box>
          </Box>
        )}

        {/* Delete spinner */}
        {isDeleting && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.12)',
              backdropFilter: 'blur(3px)',
              pointerEvents: 'none'
            }}
          >
            <CircularProgress size={16} sx={{ color: '#fff' }} />
          </Box>
        )}
      </Box>

      {/* Lightbox Dialog */}
      <Dialog
        open={openImage}
        onClose={handleCloseImage}
        maxWidth={false}
        PaperProps={{
          sx: { bgcolor: 'transparent', boxShadow: 'none' }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(8px)', // ✅ blur
            WebkitBackdropFilter: 'blur(8px)' // for Safari
          }
        }}
      >
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

        {previewUrl && (
          <Box
            component='img'
            src={previewUrl}
            alt={file?.name || 'preview'}
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

export default AttachmentImageTile
