import React, { useState, useEffect } from 'react'
import { Box, useTheme, useMediaQuery } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from 'src/authentication/useAuth'
import { fetchThreads, loadThread, chatActions } from 'src/store/chat/gendoxChat'
import { localStorageConstants } from '../../../utils/generalConstants'
import { useRouter } from 'next/router'
import ChatNavigation from 'src/views/pages/chat/ChatNavigation'
import ChatConversation from 'src/views/pages/chat/ChatConversation'
import ChatInsight from 'src/views/pages/chat/ChatInsight'
import { isValidOrganization } from 'src/utils/validators'

const GendoxChat = props => {
  const theme = useTheme()
  /**
   *  The below variable will hide the current layout menu at given screen size.
   *  The menu will be accessible from the Hamburger icon only (Vertical Overlay Menu).
   *  You can change the screen size from which you want to hide the current layout menu.
   *  Please refer useMediaQuery() hook: https://mui.com/components/use-media-query/,
   *  to know more about what values can be passed to this hook.
   *  ! Do not change this value unless you know what you are doing. It can break the template.
   */

  const { user } = useAuth()
  const dispatch = useDispatch()
  const router = useRouter()
  const { organizationId, threadId, projectId } = router.query
  const chatUrlPath = props.chatUrlPath || '/gendox/chat'
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  const embedMode = props.embedView || false
  // Redux state from chat store
  const { currentThread, agents, threads } = useSelector(state => state.gendoxChat)
  // console.log('currentThread', currentThread)
  // console.log('agents', agents)
  // console.log('threads', threads)
  // For responsive layout: hide sidebar if below large breakpoint
  const hidden = useMediaQuery(theme.breakpoints.down('lg'))

  // On mount, fetch contacts (agents + threads)
  useEffect(() => {
    const fetchData = async () => {
      dispatch(chatActions.resetChatState())
      dispatch(fetchThreads({ organizationId, token }))
    }

    if (isValidOrganization(organizationId, user) || props.authProviderOption === 'IFrameAuthProvider') {
      fetchData()
    }
  }, [dispatch, organizationId])

  // Load thread if threadId or projectId is present
  useEffect(() => {
    // Load thread if threadId or projectId is present
    if (!threadId && !projectId) {
      // TODO set a projectId from the organization
    }
    closeInsightsToggle()
    dispatch(loadThread({ projectId, threadId: threadId || null, organizationId, token }))
  }, [dispatch, projectId, threadId, organizationId, token])

  // when the current thread has been loaded along with agents and threads,
  // update the currentThread object with the agent and thread objects.
  // This is handy for displaying the agent's name, thread title, etc.
  useEffect(() => {
    // Only dispatch the update if there's a currentThread,
    // and either the agent or thread is missing or mismatched.

    if (!currentThread) {
      return
    }

    if (agents && currentThread?.projectId !== currentThread?.agent?.projectId) {
      dispatch(chatActions.updateCurrentThreadWithAgent())
    }
    if (threads && currentThread?.threadId !== currentThread?.thread?.id) {
      dispatch(chatActions.updateCurrentThreadWithThreadObj())
    }
  }, [currentThread, agents, threads, dispatch, organizationId])

  // State for mobile drawers and info sidebar
  const [mobileOpen, setMobileOpen] = useState(false)
  const [infoSidebarIsOpen, setInfoSidebarIsOpen] = useState(false)
  const [selectedChatInsightsTab, setSelectedChatInsightsTab] = useState('Sources')

  const handleNavigationToggle = () => {
    setMobileOpen(prev => !prev)
  }

  const handleInsightsToggle = () => {
    setSelectedChatInsightsTab('Agent')
    setInfoSidebarIsOpen(prev => !prev)
  }

  const openInsightsToggle = () => {
    setSelectedChatInsightsTab('Sources')
    setInfoSidebarIsOpen(true)
  }

  const closeInsightsToggle = () => {
    setInfoSidebarIsOpen(false)
    dispatch(chatActions.clearCurrentMessageMetadata())
  }

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%'
      }}
    >
      {/* Left sidebar for navigation */}
      <ChatNavigation
        mobileOpen={mobileOpen}
        onClose={handleNavigationToggle}
        chatUrlPath={chatUrlPath}
        embedMode={embedMode}
      />

      {/* Main chat conversation area */}
      <ChatConversation
        theme={theme}
        hidden={hidden}
        handleDrawerToggle={handleNavigationToggle}
        openInsightsToggle={openInsightsToggle}
        handleInsightsToggle={handleInsightsToggle}
        embedMode={embedMode}
      />

      {/* Right sidebar for additional chat insights */}
      {infoSidebarIsOpen && (
        <ChatInsight
          mobileInfoOpen={infoSidebarIsOpen}
          closeInsightsToggle={closeInsightsToggle}
          projectId={projectId}
          selectedChatInsightsTab={selectedChatInsightsTab}
          setSelectedChatInsightsTab={setSelectedChatInsightsTab}
        />
      )}
    </Box>
  )
}

export default GendoxChat
