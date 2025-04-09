import GendoxChat from "src/views/pages/chat/GendoxChat";
import Box from "@mui/material/Box";
import {useTheme} from "@mui/material/styles";
import GendoxChatLayout from "../../../layouts/GendoxChatLayout";


const ChatPage = () => {  

  const theme = useTheme();

  return (
    <Box
      sx={{
        height: `calc(100vh - ${theme.mixins.toolbar.minHeight}px - 3.5rem)`, // Adjust 64px to the height of any other elements like headers
        overflow: 'auto',
        display: 'flex',
        width: '100%'
      }}>

      <GendoxChat chatUrlPath={"/gendox/chat"}/>
    </Box>
  );

}

ChatPage.getLayout = page => <GendoxChatLayout>{page}</GendoxChatLayout>
ChatPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true,
}

export default ChatPage;
