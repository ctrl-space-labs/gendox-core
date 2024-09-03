import { formatDistanceToNow, parseISO } from "date-fns";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import GendoxMarkdownRenderer from "/src/views/gendox-components/markdown-renderer/GendoxMarkdownRenderer";
import ChatLogMessageFeedback from "/src/views/apps/chat/chatLog-components/ChatLogMessageFeedback";
import ChatLogActionButtons from "/src/views/apps/chat/chatLog-components/ChatLogActionButtons";
import ChatLogInfo from "/src/views/apps/chat/chatLog-components/ChatLogInfo";
import { fakeData } from "/src/utils/chatLogUtils";

const ChatLogMessage = ({ chat, isSender, showInfo, setShowInfo }) => {
  const formattedTime = formatDistanceToNow(parseISO(chat.time), {
    addSuffix: true,
  });

  return (
    <Box sx={{ "&:not(:last-of-type)": { mb: 3.5 } }}>
      <div>
        <Typography
          sx={{
            position: "relative",
            boxShadow: 1,
            borderRadius: 1,
            maxWidth: "100%",
            width: "fit-content",
            fontSize: "0.875rem",
            wordWrap: "break-word",
            p: (theme) => theme.spacing(3, 4),
            ml: isSender ? "auto" : undefined,
            borderTopLeftRadius: !isSender ? 0 : undefined,
            borderTopRightRadius: isSender ? 0 : undefined,
            color: isSender ? "common.white" : "text.primary",
            backgroundColor: isSender ? "primary.main" : "background.paper",
          }}
        >
          <GendoxMarkdownRenderer markdownText={chat.msg} />
        </Typography>

        <Box
          sx={{
            mt: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>

            {isSender && (
              <ChatLogMessageFeedback
                
                feedback={chat.feedback}
              />
            )}

            <Typography
              variant="caption"
              sx={{ color: "text.disabled", ml: 1 }}
            >
              {formattedTime ? formattedTime : null}
            </Typography>
          </Box>

          {!isSender && (
            <ChatLogActionButtons
              showInfo={showInfo}
              setShowInfo={setShowInfo}
            />
          )}
        </Box>

        {showInfo && !isSender ? (
          <ChatLogInfo fakeData={fakeData} />
        ) : null}
      </div>
    </Box>
  );
};

export default ChatLogMessage;
