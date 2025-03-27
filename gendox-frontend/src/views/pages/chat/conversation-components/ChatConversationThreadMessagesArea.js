import React, { useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import ScrollWrapper from 'src/views/custom-components/perfect-scroll/ScrollWrapper'
import GendoxMarkdownRenderer from '../../markdown-renderer/GendoxMarkdownRenderer'
import MessageActions from 'src/views/pages/chat/conversation-components/ChatConversationMessageActions'
import { fetchMessageMetadata } from 'src/store/chat/gendoxChat'
import CircularProgress from '@mui/material/CircularProgress'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'

const ThreadMessagesArea = ({
  hidden,
  auth,
  currentThread,
  theme,
  dispatch,
  token,
  openInfoToggle,
  isLoadingMessages,
  embedMode
}) => {
  const containerRef = useRef(null)

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'auto' })
    }
  }

  useEffect(() => {
    scrollToBottom()
    // run it 2 times, the delay is to let the layout settle,
    // for big threads, it takes time for the whole thread to be rendered and calculate the height
    setTimeout(() => {
      scrollToBottom()
    }, 500)
  }, [currentThread?.messages])

  return (
    <ScrollWrapper ref={containerRef}>
      {isLoadingMessages ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}
        >
          <CircularProgress disableShrink />
        </Box>
      ) : (
        <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {auth?.user?.id && currentThread?.messages?.length > 0 ? (
            currentThread.messages.map((message, index) => {
              // createdBy is null for public users
              const isMyMessage = message.createdBy === auth?.user?.id || message.createdBy === null
              return (
                <React.Fragment key={index}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: isMyMessage ? 'row-reverse' : 'row',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '90%',
                        p: '0.6875rem',
                        borderRadius: 2,
                        backgroundColor: isMyMessage ? theme.palette.primary.main : theme.palette.background.paper,
                        color: isMyMessage ? theme.palette.primary.contrastText : theme.palette.text.primary,
                        boxShadow: 1
                      }}
                    >
                      {/* TODO The font size is not applied */}
                      <GendoxMarkdownRenderer
                        markdownText={message.message}
                        sxOverrides={{
                          container: {
                            fontSize: '0.9rem',
                            color: isMyMessage
                              ? theme.palette.primary.contrastText
                              : theme.palette.text.primary
                          },
                          p: {
                            fontSize: '0.9rem',
                            color: isMyMessage
                              ? theme.palette.primary.contrastText
                              : theme.palette.text.primary,
                            marginBottom: 0
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  <MessageActions
                    message={message}
                    isMyMessage={isMyMessage}
                    openMetadata={() => {
                      dispatch(fetchMessageMetadata({ thread: currentThread, message, token }))
                      openInfoToggle()
                    }}
                    embedMode={embedMode}
                  />
                </React.Fragment>
              )
            })
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                mt: 4
              }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 1 }} />
              <Typography variant='h6' sx={{ color: theme.palette.text.secondary }}>
                No messages yet
              </Typography>
              <Typography variant='body2' sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                Start the conversation!
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </ScrollWrapper>
  )
}

export default ThreadMessagesArea
