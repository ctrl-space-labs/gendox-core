import React, { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'
import { useSettings } from 'src/@core/hooks/useSettings'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import PoweredByGendox from 'src/layouts/components/shared-components/PoweredByGendox'
import IconButton from '@mui/material/IconButton'
import { useRouter } from 'next/router'
import { useIFrameMessageManager } from 'src/authentication/context/IFrameMessageManagerContext'
import GendoxChat from 'src/views/pages/chat/GendoxChat'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import Icon from 'src/views/custom-components/mui/icon/icon'
import ChatInsight from 'src/views/pages/chat/ChatInsight'
import { loadSession, saveSession } from './embeddedChatSession'

// Add any extra configurations here
const gendoxChatConfig = {
  authProviderOption: 'IFrameAuthProvider',
  embedView: true,
  chatUrlPath: '/gendox/embed/embedded-chat',
  chatInsightView: false,
}
const CHAT_TOGGLE_REQUEST_EVENT = 'gendox.events.embedded.chat.toggle.request'

const StyledWrapper = styled(Box, {
  shouldForwardProp: prop => prop !== 'isOpen'
})(({ theme, isOpen }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh', // Full viewport height
  width: '100vw', // Full viewport width
  position: 'fixed', // Make it fixed to stay on the screen when opened
  bottom: 0, // Align it to the bottom of the viewport
  right: 0, // Align it to the right of the viewport
  zIndex: 1000, // Ensure it's above other content
  transition: 'transform 0.3s ease-in-out', // For smooth opening/closing animation
  transform: isOpen ? 'translateY(0)' : 'translateY(100%)' // Slide up/down based on isOpen state
}))

/**
 * Embedded chat page handles the chat window and the bubble button to toggle it
 * Also works for Unauthenticated users
 * @param props
 * @return {Element}
 * @constructor
 */
const EmbeddedChatPage = props => {
  const theme = useTheme()
  const { settings, saveSettings } = useSettings()
  const router = useRouter()
  const { organizationId, projectId } = router.query
  const [isOpen, setIsOpen] = useState(false) // Manage chat window visibility
  const iFrameMessageManager = useIFrameMessageManager()
  const { isEmbedded, iFrameConfiguration, originUrl } = iFrameMessageManager
  const isOpenRef = useRef(false)
  const sessionRestoredRef = useRef(false)

  const sendToggleMessage = nextState => {
    iFrameMessageManager.messageManager.sendMessage({
      type: 'gendox.events.embedded.chat.toggle.action',
      data: { isOpen: nextState }
    })
  }

  const applyChatState = (nextState, withAnimation = true) => {
    if (isOpenRef.current === nextState) return
    if (nextState) {
      sendToggleMessage(true)
      if (withAnimation) {
        setTimeout(() => setIsOpen(true), 10)
      } else {
        setIsOpen(true)
      }
      return
    }

    setIsOpen(false)
    if (withAnimation) {
      setTimeout(() => sendToggleMessage(false), 320)
    } else {
      sendToggleMessage(false)
    }
  }

  useEffect(() => {
    const originalSettings = settings

    // Update settings specifically for this page
    saveSettings({
      ...settings,
      footerContent: 'poweredBy',
      navBarContent: 'hidden',
      globalSearch: false,
      embeddedLayout: true
    })

    return () => saveSettings(originalSettings)
  }, [])

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  // Restore session: runs once after the init response provides sessionResumeTimeoutMs.
  // Gated by isEmbedded so it never fires when the chat page is opened directly.
  useEffect(() => {
    const timeoutMs = iFrameConfiguration?.sessionResumeTimeoutMs
    if (!isEmbedded || !timeoutMs || !originUrl || !organizationId || !projectId) return
    if (sessionRestoredRef.current) return
    sessionRestoredRef.current = true

    const session = loadSession(originUrl, organizationId, projectId, timeoutMs)
    if (!session || !session.isOpen) return

    applyChatState(true, false)
    if (session.threadId) {
      router.replace(
        { pathname: router.pathname, query: { ...router.query, threadId: session.threadId } },
        undefined,
        { shallow: true }
      )
    }
  }, [isEmbedded, iFrameConfiguration?.sessionResumeTimeoutMs, originUrl, organizationId, projectId])

  // Save session whenever the open state or active thread changes.
  // Gated by isEmbedded so host-page-less usage is unaffected.
  useEffect(() => {
    const timeoutMs = iFrameConfiguration?.sessionResumeTimeoutMs
    if (!isEmbedded || !timeoutMs || !originUrl || !organizationId || !projectId) return

    saveSession(
      originUrl,
      organizationId,
      projectId,
      { threadId: router.query.threadId ?? null, isOpen },
      timeoutMs
    )
  }, [isOpen, router.query.threadId, isEmbedded, iFrameConfiguration?.sessionResumeTimeoutMs, originUrl, organizationId, projectId])

  // Apply chat open/closed state from config (initial load and when parent calls updateConfig)
  useEffect(() => {
    const chatInitialState = iFrameMessageManager?.iFrameConfiguration?.chatInitialState
    if (chatInitialState === undefined) return
    applyChatState(chatInitialState === 'open', false)
  }, [iFrameMessageManager?.iFrameConfiguration?.chatInitialState])

  useEffect(() => {
    const handleToggleRequest = data => {
      if (data?.type !== CHAT_TOGGLE_REQUEST_EVENT) return
      const action = data?.data?.action
      if (!action) return

      if (action === 'toggle') {
        applyChatState(!isOpenRef.current)
        return
      }
      if (action === 'open') {
        applyChatState(true)
        return
      }
      if (action === 'close') {
        applyChatState(false)
      }
    }

    iFrameMessageManager.messageManager.addHandler(handleToggleRequest)
    return () => {
      iFrameMessageManager.messageManager.removeHandler(handleToggleRequest)
    }
  }, [iFrameMessageManager])

  const toggleChatWindow = () => {
    applyChatState(!isOpenRef.current)
  }

  return (
    <>
      {/* Bubble button to toggle chat window */}
      {!isOpen && (
        <IconButton
          onClick={toggleChatWindow}
          sx={{
            position: 'fixed',
            bottom: theme.spacing(0), // Place the bubble near the bottom
            right: theme.spacing(0), // Place it near the right
            // width: 60,
            // height: 60,
            borderRadius: '50%',
            zIndex: 999, // Keep above other content
            // boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)', // Add a shadow for effect
            display: 'flex', // Show the bubble when chat window is closed
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backgroundColor: 'rgba(0,0,0,0) !important'
          }}
        >
          <img
            src='/images/gendoxLogo.svg'
            alt='Chat Icon'
            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
          />
        </IconButton>
      )}

      {/* Chat window */}
      <StyledWrapper
        isOpen={isOpen} // Pass the isOpen prop here
        sx={{
          backgroundImage:
            settings.mode === 'light'
              ? `url('/images/gendox-back-light.webp')`
              : `url('/images/gendox-back-dark.webp')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* "X" button to close the chat window */}
        {isOpen && (
          <IconButton
            onClick={toggleChatWindow}
            sx={{
              position: 'absolute',
              top: theme.spacing(3),
              right: theme.spacing(3),
              zIndex: 1002 // Ensure it stays above the chat window content
              // color: '#fff', // Customize color if needed
            }}
          >
            {/* <Icon icon='mdi:close' /> */}
            <Icon icon='mdi:window-close' />
          </IconButton>
        )}

        <Box className='embedded-app-chat' sx={{ flex: 1, maxHeight: 'calc(100% - 3rem)' }}>
          <GendoxChat {...gendoxChatConfig} />
        </Box>
        <footer>
          <Box
            sx={{
              padding: theme.spacing(2)
            }}
          >
            <PoweredByGendox />
          </Box>
        </footer>
      </StyledWrapper>
    </>
  )
}

EmbeddedChatPage.pageConfig = {
  authProviderOption: gendoxChatConfig.authProviderOption,
  routeType: routeTypes.sharedRoute,
  embeddedLayout: true,
  mode: 'light'
}

EmbeddedChatPage.getLayout = page => <BlankLayout>{page}</BlankLayout>

export default EmbeddedChatPage
