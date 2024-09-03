// ** React Imports
import { useRef, useEffect, useState } from "react";

import Box from "@mui/material/Box";
import ChatLogScrollWrapper from "./chatLog-components/ChatLogScrollWrapper";
import ChatLogMessageGroup from "./chatLog-components/ChatLogMessageGroup";
import {
  fakeData,
  formattedChatData,
  scrollToBottom,
} from "/src/utils/chatLogUtils";

const ChatLog = (props) => {
  const chatArea = useRef(null);
  const { data, hidden } = props;
  const projectId = data.contact.projectId;
  const [showInfo, setShowInfo] = useState(false);

  console.log("ChatLog data", data);

  useEffect(() => {
    if (data && data.chat && data.chat.chat.length) {
      scrollToBottom(chatArea, hidden);
    }
  }, [data]);

  

  const renderChats = () => {
    return formattedChatData(data).map((item, index) => (
      <ChatLogMessageGroup
        key={index}
        item={item}
        data={data}
        showInfo={showInfo}
        setShowInfo={setShowInfo}
      />
    ));
  };

  return (
    <Box sx={{ height: "calc(100% - 8.4375rem)" }}>
      <ChatLogScrollWrapper hidden={hidden} chatArea={chatArea}>
        {renderChats()}
      </ChatLogScrollWrapper>
    </Box>
  );
};

export default ChatLog;
