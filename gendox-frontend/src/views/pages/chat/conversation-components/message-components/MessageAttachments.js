import React from 'react'
import { Box, Typography } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'

const MessageAttachments = ({ attachments }) => {
  if (!Array.isArray(attachments) || attachments.length === 0) return null

  const isImg = a => a.kind === 'image' || (a.mimeType || '').startsWith('image/')

  const images = attachments.filter(a => isImg(a) && a.remoteUrl)
  const files = attachments.filter(a => !isImg(a) || !a.remoteUrl)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* ✅ Images preview (like ChatGPT) */}
      {images.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {images.map(img => (
            <Box
              key={img.id}
              sx={{
                width: 280,
                maxWidth: '100%',
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Box
                component='img'
                src={img.previewUrl}
                alt={img.name}
                sx={{
                  width: '100%',
                  height: 'auto',
                  display: 'block'
                }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* ✅ Files pill */}
      {files.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {files.map(f => (
            <Box
              key={f.id}
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
                maxWidth: 420
              }}
              title={f.name}
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
                  {f.name}
                </Typography>
                {/* <Typography variant='caption' sx={{ opacity: 0.8 }} noWrap>
                  {f.mimeType || 'File'}
                </Typography> */}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default MessageAttachments
