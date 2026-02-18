
import GendoxChat from 'src/views/pages/chat/GendoxChat'
import Box from '@mui/material/Box'


const gendoxChatConfig = {
  // authProviderOption: 'IFrameAuthProvider',
  embedView: false,
  chatUrlPath: '/gendox/tasks/earth-observation/workspace',
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