import React, { useState } from 'react'
import { List, Typography, Box, IconButton } from '@mui/material'
import VerticalNavLink from 'src/@core/layouts/components/vertical/navigation/VerticalNavLink'
import ScrollWrapper from 'src/views//custom-components/perfect-scroll/ScrollWrapper'
import { groupThreadsByDate } from 'src/views/pages/chat/utils/chatFormatter'
import ChatThreadMenu from 'src/views/pages/chat//navigation-components/ChatThreadMenu'

const ChatThreads = ({ threads, chatUrlPath, onClose, organizationId, hidden, searchQuery, embedMode }) => {
  const filteredThreads = searchQuery
    ? threads.filter(thread => thread.agent.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    : threads
  const groupedThreads = groupThreadsByDate(filteredThreads || [])

  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedThreadForMenu, setSelectedThreadForMenu] = useState(null)

  const handleOpenMenu = (event, thread) => {
    setAnchorEl(event.currentTarget)
    setSelectedThreadForMenu(thread)
  }
  const handleCloseMenu = () => {

   
    setAnchorEl(null)    
  }
  return (
    <Box sx={{ flex: 2, minHeight: 0 }}>
      <ScrollWrapper hidden={hidden} style={{ height: '100%' }}>
        {filteredThreads && filteredThreads.length > 0 ? (
          <>
            <Typography variant='h6' gutterBottom color='primary'>
              Threads
            </Typography>
            <List disablePadding>
              {Object.entries(groupedThreads).map(([groupLabel, groupItems]) => {
                if (groupItems.length === 0) return null
                return (
                  <Box key={groupLabel} sx={{ mb: 2 }}>
                    <Typography variant='caption' display='block' sx={{ mb: 1, pl: 4 }} color='primary'>
                      {groupLabel}
                    </Typography>
                    {groupItems.map(thread => (
                      <VerticalNavLink
                        key={thread.threadId}
                        item={{
                          id: thread.id,
                          path: `${chatUrlPath}/?organizationId=${organizationId}&projectId=${thread.agent.projectId}&threadId=${thread.threadId}`,
                          title: thread.agent.fullName,
                          subtitle: thread.latestMessageValue || 'No messages yet',
                          threadName: thread.threadName || 'No name',
                          // icon: () => <Icon icon="mdi:message" />,
                          // Optionally, pass badge info if needed:
                          badgeContent: thread.badgeContent,
                          badgeColor: thread.badgeColor,
                          disabled: false,
                          openInNewTab: false
                        }}
                        navVisible
                        toggleNavVisibility={onClose}
                        onOpenMenu={!embedMode ? handleOpenMenu : undefined}
                        />
                    ))}
                  </Box>
                )
              })}
            </List>
          </>
        ) : (
          <Typography variant='body2'>No threads available.</Typography>
        )}
        <ChatThreadMenu anchorEl={anchorEl} handleCloseMenu={handleCloseMenu} selectedThread={selectedThreadForMenu} setSelectedThreadForMenu={setSelectedThreadForMenu} />
      </ScrollWrapper>
    </Box>
  )
}

export default ChatThreads
