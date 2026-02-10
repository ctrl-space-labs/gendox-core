import { Box, IconButton, CircularProgress, Skeleton } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'

const AttachmentImageTile = ({ attachment, onRemove }) => {
  const { id, previewUrl, file } = attachment
  const isUploading = attachment.status === 'uploading'
  const isDeleting = attachment.status === 'deleting'
  const isBusy = isUploading || isDeleting

  return (
    <Box
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
        '&:hover .removeBtn': { opacity: 1 },
        ...(isUploading && { opacity: 0.92 }),
        ...(isDeleting && { opacity: 0.65, filter: 'blur(1px) grayscale(0.35)' })
      }}
      title={file.name}
    >
      <IconButton
        className='removeBtn'
        size='small'
        disabled={isBusy}
        onClick={() => onRemove(id)}
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
          {/* shimmer plate */}
          <Box sx={{ width: '70%', borderRadius: 2, overflow: 'hidden' }}>
            <Skeleton variant='rectangular' width='100%' height={10} />
          </Box>
        </Box>
      )}

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
  )
}

export default AttachmentImageTile
