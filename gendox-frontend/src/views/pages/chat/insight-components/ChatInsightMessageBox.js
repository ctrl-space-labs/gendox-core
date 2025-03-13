import React from 'react'
import { useSelector } from 'react-redux'
import { Box, Typography, Divider } from '@mui/material'

const ChatMessageBox = () => {
  const { currentMessageMetadata, isLoadingMetadata } = useSelector(state => state.gendoxChat)

  return (
    <Box sx={{ p: 2 }}>
      {!currentMessageMetadata ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}
        >
          <Typography variant='body2'>No chat selected.</Typography>
        </Box>
      ) : (
        <>
          <Typography
            variant='body2'
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            <strong>Message:</strong> {currentMessageMetadata.message?.message}
          </Typography>
        </>
      )}
    </Box>
  )
}

export default ChatMessageBox
