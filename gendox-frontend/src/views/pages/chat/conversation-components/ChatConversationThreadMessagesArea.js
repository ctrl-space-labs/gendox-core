import React, {useEffect, useMemo, useRef} from 'react'
import { Box, Typography } from '@mui/material'
import ScrollWrapper from 'src/views/custom-components/perfect-scroll/ScrollWrapper'
import GendoxMarkdownRenderer from '../../markdown-renderer/GendoxMarkdownRenderer'
import MessageActions from 'src/views/pages/chat/conversation-components/ChatConversationMessageActions'
import { fetchMessageMetadata } from 'src/store/chat/gendoxChat'
import CircularProgress from '@mui/material/CircularProgress'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import ToolCallHeader from "./ToolCallHeader";

const ThreadMessagesArea = ({
  hidden,
  auth,
  currentThread,
  theme,
  dispatch,
  token,
  openInfoToggle,
  isLoadingMessages,
  embedMode,
  chatInsightView
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

  /**
   * Turn the raw message list that comes from the server into a list that
   * the UI can render directly.
   *
   *  • A normal chat message becomes `{ type: 'chatMessage', message }`
   *  • An assistant “tool-call + its tool responses” becomes
   *    `{ type: 'toolCall', headerMessage, toolResponses: [] }`
   *
   * The order of items is preserved.
   *
   * @param {Array<Object>} rawMessages – `currentThread.messages`
   * @returns {Array<Object>} displayItems – list ready for `map()`
   */
  function buildDisplayItems(rawMessages = []) {
    const displayItems = [];
    let openToolBundle = null; // tracks the bundle we’re currently filling

    rawMessages.forEach(msg => {
      // ────────────────────────────────────────────────────────────────
      // 1️⃣  Does this assistant message *trigger* tool-calls?
      //     (Text is optional, toolCalls are mandatory.)
      // ────────────────────────────────────────────────────────────────
      const hasToolCalls =
        msg.role === 'assistant' &&
        Array.isArray(msg.toolCalls) &&
        msg.toolCalls.length > 0;

      if (hasToolCalls) {
        // Flush any previous bundle that never got tool responses
        if (openToolBundle) {
          displayItems.push(openToolBundle);
        }

        // If the assistant ALSO sent visible text, render that first
        const hasVisibleText = msg.message && msg.message.trim() !== '';
        if (hasVisibleText) {
          displayItems.push({ type: 'chatMessage', message: msg });
        }

        // Start a new bundle that will collect the tool outputs
        openToolBundle = {
          type: 'toolCall',
          headerMessage: msg,
          toolResponses: []
        };
        return; // nothing else to do for this msg
      }

      // ────────────────────────────────────────────────────────────────
      // 2️⃣  Tool response → attach to the open bundle
      // ────────────────────────────────────────────────────────────────
      if (msg.role === 'tool' && openToolBundle) {
        openToolBundle.toolResponses.push(msg);
        return;
      }

      // ────────────────────────────────────────────────────────────────
      // 3️⃣  Any other message closes the current bundle (if any)
      // ────────────────────────────────────────────────────────────────
      if (openToolBundle) {
        displayItems.push(openToolBundle);
        openToolBundle = null;
      }

      displayItems.push({ type: 'chatMessage', message: msg });
    });

    // Don’t forget the trailing bundle at EOF
    if (openToolBundle) {
      displayItems.push(openToolBundle);
    }

    return displayItems;
  }

  const displayItems = useMemo(
    () => buildDisplayItems(currentThread?.messages),
    [currentThread?.messages]
  );

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
          {auth?.user?.id && displayItems.length > 0 ? (
            displayItems.map((item, index) => {

              // Tool-call header + its outputs in a single collapsible row
              if (item.type === 'toolCall') {
                return (
                  <Box
                    key={index}
                    sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' }}
                  >
                    <ToolCallHeader
                      header={item.headerMessage}
                      outputs={item.toolResponses}
                      theme={theme}
                    />
                  </Box>
                );
              }

              const { message } = item;
              const isMyMessage =
                message.createdBy === auth?.user?.id || message.createdBy === null;
              const nextIsToolCall = displayItems[index + 1]?.type === 'toolCall';

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
                  {!nextIsToolCall && (
                    <MessageActions
                      message={message}
                      isMyMessage={isMyMessage}
                      openMetadata={() => {
                        dispatch(fetchMessageMetadata({ thread: currentThread, message, token }))
                        openInfoToggle()
                      }}
                      embedMode={embedMode}
                      chatInsightView={chatInsightView}
                    />
                  )}
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
