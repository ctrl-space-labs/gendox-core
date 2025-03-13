import React from 'react'
import { useState } from 'react'
import { Box, IconButton } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Typography from '@mui/material/Typography'
import Chip from '../../../custom-components/mui/chip'
import { fetchMessageMetadata } from '../../../../store/chat/gendoxChat'
import Tooltip from '@mui/material/Tooltip'
import { copyToClipboard } from 'src/utils/copyToClipboard'

const MessageActions = ({ message, isMyMessage, openMetadata }) => {
  if (!message) {
    return null
  }
  const [copyActive, setCopyActive] = useState(false)

  const handleCopy = () => {
    copyToClipboard(message.message)
    setCopyActive(true)
    setTimeout(() => {
      setCopyActive(false) // Reset after a short delay
    }, 8000) // 2 seconds delay
  }

  const timeString = message.createdAt ? new Date(message.createdAt).toLocaleString() : ''

  // If it's my message, show only the time, aligned right.
  if (isMyMessage) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pl: '0.6875rem' }}>
        {timeString && (
          <Typography variant='caption' sx={{ opacity: 0.7 }}>
            {timeString}
          </Typography>
        )}
      </Box>
    )
  }

  // If it's not my message, show the full content aligned left.
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        alignItems: 'flex-start'
      }}
    >
      {/* First row: Sources Chip */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Chip
          clickable
          onClick={() => {
            openMetadata()
          }}
          variant='outlined'
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant='inherit'>Sources</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Icon icon='mdi:file-pdf-box' sx={{ width: 16, height: 16 }} />
                <Icon icon='mdi:web' sx={{ width: 16, height: 16 }} />
              </Box>
            </Box>
          }
        />
      </Box>

      {/* Second row: Time and icons */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pl: '0.6875rem'
        }}
      >
        {timeString && (
          <Typography variant='caption' sx={{ opacity: 0.7 }}>
            {timeString}
          </Typography>
        )}

        <Box
          sx={{
            mx: 1,
            height: '1rem',
            width: '1px',
            bgcolor: 'divider'
          }}
        />

        <Tooltip title='Copy'>
          <IconButton
            onClick={handleCopy}
            sx={{
              color: copyActive ? 'primary.main' : 'inherit'
            }}
          >
            <Icon icon='mdi:content-copy' style={{ fontSize: '1rem' }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default MessageActions
