import { Box, IconButton, Typography, Skeleton } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { getDocLabel, formatBytes } from './attachmentUtils'
import { shimmerSx } from 'src/utils/shimmerSx'
import CircularProgress from '@mui/material/CircularProgress'

const AttachmentDocPill = ({ attachment, onRemove }) => {
  const { id, file } = attachment
  const isUploading = attachment.status === 'uploading'
  const isDeleting = attachment.status === 'deleting'

  const isBusy = isUploading || isDeleting

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.25,
        py: 1,
        minWidth: 240,
        maxWidth: 420,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: 1,
        flex: '0 0 auto',
        position: 'relative',
        overflow: 'hidden'
      }}
      title={file.name}
    >
      {/* Left icon box */}
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.contrastText',
          flex: '0 0 auto'
        }}
      >
        <Icon icon='mdi:file-document-outline' />
      </Box>

      {/* Text */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {isUploading && (
          <Box sx={{ ...shimmerSx }}>
            <Skeleton variant='text' width='72%' height={18} />
            <Skeleton variant='text' width='48%' height={14} />
          </Box>
        )}

        {isDeleting && (
          <>
            <Typography variant='subtitle2' sx={{ fontWeight: 700 }}>
              Deleting…
            </Typography>
            <Typography variant='caption' sx={{ opacity: 0.7 }}>
              Please wait
            </Typography>
          </>
        )}

        {!isUploading && !isDeleting && (
          <>
            <Typography variant='subtitle2' noWrap sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {file.name}
            </Typography>
            <Typography variant='caption' sx={{ opacity: 0.8 }} noWrap>
              {getDocLabel(file)} • {formatBytes(file.size)}
            </Typography>
          </>
        )}
      </Box>

      {/* Close */}
      <IconButton
        size='small'
        disabled={isBusy}
        onClick={() => onRemove(id)}
        sx={{
          width: 28,
          height: 28,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}
      >
        <Icon icon='mdi:close' />
      </IconButton>
      {isUploading && (
        <Box sx={{ mt: 0.75 }}>
          <Skeleton variant='rectangular' width='100%' height={4} />
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
            bgcolor: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(3px)',
            pointerEvents: 'none'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={18} thickness={4} />
            <Typography variant='caption' sx={{ fontWeight: 600 }}>
              Deleting…
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default AttachmentDocPill
