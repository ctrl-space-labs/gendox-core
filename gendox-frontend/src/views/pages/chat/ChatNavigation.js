import React, { useState } from 'react'
import { Box, Drawer, Divider, useMediaQuery, useTheme } from '@mui/material'

// Redux imports
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { getDrawerProps } from 'src/views/pages/chat/utils/drawerProps'
import ChatAgents from 'src/views/pages/chat/navigation-components/ChatAgents'
import ChatThreads from 'src/views/pages/chat/navigation-components/ChatThreads'
import ChatNavigationSearch from 'src/views/pages/chat/navigation-components/ChatNavigationSearch'

// ─────────────────────────────────────────────────────────────────────────────
// ChatAgentsAndThreads – Left Sidebar - Chat Navigation
// ─────────────────────────────────────────────────────────────────────────────
const drawerWidth = 350 // Adjust as you like

/**
 * The main component for the Chat Sidebar.
 * Contains the Agents and Threads lists.
 * @param mobileOpen
 * @param onClose
 * @return {Element}
 * @constructor
 */
const ChatNavigation = ({ mobileOpen, onClose, chatUrlPath }) => {
  const theme = useTheme()
  const router = useRouter()
  const hidden = useMediaQuery(theme.breakpoints.down('lg'))
  const drawerProps = getDrawerProps({ hidden, mobileOpen, onClose, theme, drawerWidth })

  // -------------- URL Params --------------
  const { organizationId, projectId } = router.query

  // -------------- Redux State --------------
  const { agents, threads } = useSelector(state => state.gendoxChat)

 
  // NEW: Local state for search query
  const [searchQuery, setSearchQuery] = useState('')



  return (
    <>
      <Drawer {...drawerProps}>
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", p: "1rem" }}>
          {/* Search Field */}
          <ChatNavigationSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

          {/* Container for the scrollable sections */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            
            {/* Agents Section */}
            <ChatAgents
              agents={agents}
              chatUrlPath={chatUrlPath}
              onClose={onClose}
              organizationId={organizationId}              
              projectId={projectId}
              hidden={hidden}
              searchQuery={searchQuery}
            />

            <Divider sx={{ my: 2 }} />

            {/* Threads Section */}
            <ChatThreads
              threads={threads}
              chatUrlPath={chatUrlPath}              
              onClose={onClose}
              organizationId={organizationId}
              hidden={hidden}
              searchQuery={searchQuery}
            />
          </Box>
        </Box>
      </Drawer>

    </>
  )
}

export default ChatNavigation
