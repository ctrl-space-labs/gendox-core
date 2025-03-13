import React from 'react'
import { Box, IconButton, ListItemIcon, Typography, useTheme } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import UserIcon from 'src/layouts/components/UserIcon'
import { AgentAvatar } from 'src/views/pages/chat/utils/chatUtils'

const ChatConversationHeader = ({ hidden, handleDrawerToggle, currentThread, themeConfig, handleInsightsToggle, isLoadingMessages }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        p: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.palette.divider}`,
        height: 60,
        filter: isLoadingMessages  ? 'blur(6px)' : 'none',
      }}
    >
      {/* Left group */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {hidden && (
          <IconButton onClick={handleDrawerToggle}>
            <Icon icon='mdi:menu' />
          </IconButton>
        )}

        <ListItemIcon sx={{ mr: 2.5, color: 'text.primary', transition: 'margin .25s ease-in-out', cursor: 'pointer' }} onClick={handleInsightsToggle}> 
          <UserIcon icon={() => <AgentAvatar isSelected={false} fullName={currentThread?.agent?.fullName} />} />
        </ListItemIcon>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            overflow: themeConfig.menuTextTruncate ? 'hidden' : 'visible'
          }}
        >
          <Typography
            variant='body1'
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {currentThread?.agent?.fullName}
          </Typography>
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {currentThread?.agent?.description}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default ChatConversationHeader
