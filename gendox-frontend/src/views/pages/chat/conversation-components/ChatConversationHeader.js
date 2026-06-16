import React from 'react'
import { Box, IconButton, ListItemIcon, Tooltip, Typography, useTheme } from '@mui/material'
import Icon from 'src/views/custom-components/mui/icon/icon'
import UserIcon from 'src/layouts/components/UserIcon'
import { AgentAvatar } from 'src/views/pages/chat/utils/chatUtils'

const ChatConversationHeader = ({
  hidden,
  handleDrawerToggle,
  currentThread,
  themeConfig,
  handleInsightsToggle,
  isLoadingMessages,
  chatInsightView,
  onCreateNewThread
}) => {
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
        filter: isLoadingMessages ? 'blur(6px)' : 'none'
      }}
      id={'chat-conversation-header'}
    >
      {/* Left group */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {hidden && (
          <IconButton onClick={handleDrawerToggle}>
            <Icon icon='mdi:menu' />
          </IconButton>
        )}

        <ListItemIcon
          sx={{
            mr: 2.5,
            color: 'text.primary',
            transition: 'margin .25s ease-in-out',
            cursor: chatInsightView ? 'pointer' : 'default'
          }}
          onClick={handleInsightsToggle}
        >
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

      {/* TODO: Remove this, in the embedded chat, it falls directly under the 'x' button */}
      {/* <Tooltip title='New chat'>
        <IconButton onClick={onCreateNewThread} size='small'>
          <Icon icon='mdi:plus' />
        </IconButton>
      </Tooltip> */}
    </Box>
  )
}

export default ChatConversationHeader
