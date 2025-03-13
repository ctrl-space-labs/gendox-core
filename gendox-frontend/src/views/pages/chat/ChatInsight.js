import { Box, Drawer, SwipeableDrawer, useMediaQuery, useTheme, Divider } from '@mui/material'
import { useSelector } from 'react-redux'
import ScrollWrapper from '../../custom-components/perfect-scroll/ScrollWrapper'
import ChatInsightMessageBox from './insight-components/ChatInsightMessageBox'
import ChatInsightHeader from './insight-components/ChatInsightHeader'
import ChatInsightSourcesContent from './insight-components/ChatInsightSourcesContent'
import ChatInsightAgentContent from './insight-components/ChatInsightsAgentContent'

// ─────────────────────────────────────────────────────────────────────────────
// ChatInfo – Right Sidebar
// On desktop: persistent drawer on the right
// On mobile: swipeable bottom drawer
// ─────────────────────────────────────────────────────────────────────────────
const rightDrawerWidth = 400

const ChatInsight = ({
  mobileInfoOpen,
  closeInsightsToggle,
  containerRef,
  projectId,
  selectedChatInsightsTab,
  setSelectedChatInsightsTab
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { currentThread, currentMessageMetadata, isLoadingMetadata } = useSelector(state => state.gendoxChat)

  // Content inside the info drawer
  const infoContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ChatInsightHeader
        closeInsightsToggle={closeInsightsToggle}
        selectedChatInsightsTab={selectedChatInsightsTab}
        setSelectedChatInsightsTab={setSelectedChatInsightsTab}
        currentMessageMetadata={currentMessageMetadata}
      />
      <ChatInsightMessageBox />
      <Divider>{selectedChatInsightsTab}</Divider>

      <ScrollWrapper sx={{ flexGrow: 1, px: 2 }} hidden={isMobile}>
        {selectedChatInsightsTab === 'Agent' ? (
          <ChatInsightAgentContent projectId={projectId} currentThread={currentThread} />
        ) : (
          <ChatInsightSourcesContent
            isLoadingMetadata={isLoadingMetadata}
            currentMessageMetadata={currentMessageMetadata}
          />
        )}
      </ScrollWrapper>
    </Box>
  )

  // For desktop: persistent right drawer
  // For mobile: bottom swipeable drawer
  return isMobile ? (
    <SwipeableDrawer
      anchor='bottom'
      open={mobileInfoOpen}
      onClose={closeInsightsToggle}
      onOpen={() => {}}
      swipeAreaWidth={50}
      sx={{
        '& .MuiDrawer-paper': {
          width: '100%',
          backgroundColor: theme.palette.background.paper,
          minHeight: '75vh',
          maxHeight: '75vh',
          overflow: 'auto' // allow scrolling
        }
      }}
    >
      {/* Drag Handle */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 2
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.palette.divider
          }}
        />
      </Box>

      {/* Scrollable area */}
      <Box>{infoContent}</Box>
    </SwipeableDrawer>
  ) : (
    <Drawer
      variant='persistent'
      anchor='right'
      open={mobileInfoOpen}
      onClose={closeInsightsToggle}
      sx={{
        position: 'static',
        width: rightDrawerWidth,
        flexShrink: 0,
        // Update the paper to use a column flex layout
        [`& .MuiDrawer-paper`]: {
          position: 'static',
          width: rightDrawerWidth,
          backgroundColor: theme.palette.action.hover,
          boxSizing: 'border-box',
          borderLeft: `1px solid ${theme.palette.divider}`,
          borderTopRightRadius: theme.shape.borderRadius,
          borderBottomRightRadius: theme.shape.borderRadius,
          display: 'flex',
          flexDirection: 'column',
          height: '100%' // Changed from "100vh" to "100%"
        }
      }}
    >
      {infoContent}
    </Drawer>
  )
}

export default ChatInsight
