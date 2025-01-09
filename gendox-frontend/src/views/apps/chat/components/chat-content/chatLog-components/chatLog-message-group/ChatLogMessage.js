import React, { useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import GendoxMarkdownRenderer from "/src/views/gendox-components/markdown-renderer/GendoxMarkdownRenderer";
import ChatLogMessageFeedback from "src/views/apps/chat/components/chat-content/chatLog-components/chatLog-message-group/chatLog-message-components/ChatLogMessageFeedback";
import ChatLogActionButtons from "src/views/apps/chat/components/chat-content/chatLog-components/chatLog-message-group/chatLog-message-components/ChatLogActionButtons";
import ChatLogInfo from "src/views/apps/chat/components/chat-content/chatLog-components/chatLog-message-group/chatLog-message-components/ChatLogInfo";
import chatThreadService from "src/gendox-sdk/chatThreadService";
import authConfig from "src/configs/auth";

const ChatLogMessage = ({ message, isSender }) => {
  const [messageMetadata, setMessageMetadata] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const storedToken = localStorage.getItem(authConfig.storageTokenKeyName);

  const formattedTime = formatDistanceToNow(parseISO(message.time), {
    addSuffix: true,
  });

  const fetchChatMessageInfo = async () => {  
    
    try {
      const response = await chatThreadService.getThreadMessageMetadataByMessageId(
        message.threadId,
        message.messageId,
        storedToken
      );
      setMessageMetadata(response.data);
      
    }
    catch (error) {
      console.error(error);
    }
  }      

  return (
    <Box sx={{ "&:not(:last-of-type)": { mb: 3.5 } }}>
      
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
          <GendoxMarkdownRenderer markdownText={message.msg} />
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
                
                feedback={message.feedback}
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
              fetchChatMessageInfo={fetchChatMessageInfo}
              messageToCopy={message.msg}
            />
          )}
        </Box>

        {showInfo && !isSender ? (
          <ChatLogInfo messageMetadata={messageMetadata} />
        ) : null}
      
    </Box>
  );
};

export default ChatLogMessage;
