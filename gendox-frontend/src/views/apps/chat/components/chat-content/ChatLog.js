// ** React Imports
import { useRef, useEffect, useState } from "react";

import Box from "@mui/material/Box";
import ChatLogScrollWrapper from "src/views/apps/chat/components/chat-content/chatLog-components/ChatLogScrollWrapper";
import ChatLogMessageGroup from "src/views/apps/chat/components/chat-content/chatLog-components/ChatLogMessageGroup";
import {
  formattedChatData,
  scrollToBottom,
} from "/src/utils/chatLogUtils";


const ChatLog = (props) => {
  const chatArea = useRef(null);
  const { data, hidden } = props;
  const projectId = data.contact.projectId;  


  useEffect(() => {
    if (data && data.chat && data.chat.chat.length) {
      scrollToBottom(chatArea, hidden);
    }
  }, [data]);

  const renderChats = () => {
    return formattedChatData(data).map((messageData, index) => (
      <ChatLogMessageGroup
        key={index}
        messageData={messageData}
        data={data}        
      />
    ));
  };

  return (
    <Box sx={{
      height: "calc(100% - 8.4375rem)",
      flexGrow: 1,
      overflowY: "auto",
    }}>
      <ChatLogScrollWrapper hidden={hidden} chatArea={chatArea}>
        {renderChats()}
      </ChatLogScrollWrapper>
    </Box>
  );
};

export default ChatLog;
