import { Box, useMediaQuery, useTheme } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMessageMetadata } from 'src/store/chat/gendoxChat'
import { ResponsiveCardContent } from 'src/utils/responsiveCardContent'
import { localStorageConstants } from '../../../utils/generalConstants'
import { useRouter } from 'next/router'
import themeConfig from '../../../configs/themeConfig'
import ChatConversationInputSection from 'src/views/pages/chat/conversation-components/ChatConversationInputSection'
import { useAuth } from '../../../authentication/useAuth'
import ChatConversationHeader from 'src/views/pages/chat/conversation-components/ChatConversationHeader'
import AiResponseLoader from 'src/views/pages/chat/conversation-components/AiResponseLoader'
import ChatConversationThreadMessagesArea from 'src/views/pages/chat/conversation-components/ChatConversationThreadMessagesArea'

// ─────────────────────────────────────────────────────────────────────────────
// GendoxChat – Parent component containing the three sub‐components
// ─────────────────────────────────────────────────────────────────────────────
const ChatConversation = props => {
  const dispatch = useDispatch()
  const theme = useTheme()
  /**
   *  The below variable will hide the current layout menu at given screen size.
   *  The menu will be accessible from the Hamburger icon only (Vertical Overlay Menu).
   *  You can change the screen size from which you want to hide the current layout menu.
   *  Please refer useMediaQuery() hook: https://mui.com/components/use-media-query/,
   *  to know more about what values can be passed to this hook.
   *  ! Do not change this value unless you know what you are doing. It can break the template.
   */
  const hidden = useMediaQuery(theme.breakpoints.down('lg'))
  const auth = useAuth()
  const router = useRouter()
  const { organizationId } = router.query
  const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
  // Grab state data from Redux
  const { currentThread, isSendingMessage, isLoadingMessages } = useSelector(
    state => state.gendoxChat
  )



  return (
    <ResponsiveCardContent
      sx={{
        backgroundColor: 'action.hover',
        transition: 'filter 0.3s ease',
        p: '0 !important',
        width: '100%'
      }}
    >      
      <Box
        component='main'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%'
        }}
      >
        <ChatConversationHeader
          hidden={hidden}
          handleDrawerToggle={props.handleDrawerToggle}
          currentThread={currentThread}
          themeConfig={themeConfig}
          handleInsightsToggle={props.handleInsightsToggle}
          isLoadingMessages={isLoadingMessages}
        />

        {/* This Box will take up the remaining space */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <ChatConversationThreadMessagesArea
            hidden={hidden}
            auth={auth}
            currentThread={currentThread}
            theme={theme}
            dispatch={dispatch}
            fetchMessageMetadata={fetchMessageMetadata}
            token={token}
            openInfoToggle={props.openInsightsToggle}
            isLoadingMessages={isLoadingMessages}
          />
        </Box>

        <AiResponseLoader isSending={isSendingMessage} />

        <Box sx={{ p: '0.5rem' }}>
          <ChatConversationInputSection
            auth={auth}
            token={token}
            dispatch={dispatch}
            currentThread={currentThread}
            organizationId={organizationId}
            isSending={isSendingMessage}
            isLoadingMessages={isLoadingMessages}
          />
        </Box>
      </Box>
    </ResponsiveCardContent>
  )
}

export default ChatConversation
