import { formatDistanceToNow, parseISO } from "date-fns";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import GendoxMarkdownRenderer from "/src/views/gendox-components/markdown-renderer/GendoxMarkdownRenderer";
import ChatLogMessageFeedback from "/src/views/apps/chat/chatLog-components/ChatLogMessageFeedback";
import ChatLogActionButtons from "/src/views/apps/chat/chatLog-components/ChatLogActionButtons";
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
          <GendoxMarkdownRenderer  markdownText={chat.msg} />
          {!isSender && (
            <ChatLogActionButtons showInfo={showInfo} setShowInfo={setShowInfo} />
          )}

          {showInfo && !isSender && fakeData && fakeData.length > 0 ? (
            <Box sx={{ display: "flex", mt: 3 }}>
              {fakeData.map((answerInfo, idx) => (
                <Link
                  key={idx}
                  href={`/gendox/document-instance/?documentId=${answerInfo.documentId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    ml: { xs: 1, sm: 2, md: idx !== 0 ? 5 : 0 },
                    color: isSender ? "common.white" : "primary.main",
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                      backgroundColor: isSender
                        ? "primary.dark"
                        : "secondary.light",
                      color: "common.white",
                    },
                    p: 1,
                    borderRadius: 1,
                    flexGrow: 1,
                    textAlign: "center",
                  }}
                >
                  Link-{idx + 1}
                </Link>
              ))}
            </Box>
          ) : null}
        </Typography>
      </div>
      <Box
        sx={{
          mt: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: isSender ? "flex-end" : "flex-start",
        }}
      >
        <ChatLogMessageFeedback isSender={isSender} feedback={chat.feedback} />
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {formattedTime ? formattedTime : null}
        </Typography>
      </Box>
    </Box>
  );
};

export default ChatLogMessage;
