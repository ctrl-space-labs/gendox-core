
import GendoxChat from 'src/views/pages/chat/GendoxChat'
import Box from '@mui/material/Box'


const gendoxChatConfig = {
  authProviderOption: 'IFrameAuthProvider',
  embedView: true,
  chatUrlPath: '/gendox/embed/embedded-chat',
  chatInsightView: false,
  hideSidebar: true,
}

export default function ChatPanel() {
  return (
   <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <GendoxChat {...gendoxChatConfig} />
        </Box>
  );
}