import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'
import { useSettings } from 'src/@core/hooks/useSettings'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import PoweredByGendox from 'src/layouts/components/shared-components/PoweredByGendox'
import IconButton from '@mui/material/IconButton'
import { useIFrameMessageManager } from 'src/authentication/context/IFrameMessageManagerContext'
import GendoxChat from 'src/views/pages/chat/GendoxChat'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import Icon from 'src/views/custom-components/mui/icon/icon'

// Add any extra configurations here
const gendoxChatConfig = {
  authProviderOption: 'IFrameAuthProvider',
  embedView: true,
  chatUrlPath: '/gendox/embed/embedded-chat'
}

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
  const [isOpen, setIsOpen] = useState(false) // Manage chat window visibility
  const iFrameMessageManager = useIFrameMessageManager()

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

  const toggleChatWindow = () => {
    const nextState = !isOpen
    const sendMessage = () => {
      iFrameMessageManager.messageManager.sendMessage({
        type: 'gendox.events.embedded.chat.toggle.action',
        data: { isOpen: nextState }
      })
    }

    // Delay logic depending on whether we're opening or closing
    if (nextState) {
      sendMessage() // Opening: send the message immediately
      setTimeout(() => setIsOpen(nextState), 10) // Delay state update
    } else {
      setIsOpen(nextState) // Closing: update state immediately
      setTimeout(sendMessage, 320) // Delay message, to show the closing animation
    }
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
            <Icon icon='mdi:window-minimize' />
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
