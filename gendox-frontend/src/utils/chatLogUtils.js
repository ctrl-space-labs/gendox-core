export const formattedChatData = (chatLogData) => {
  let chatLog = [];
  if (chatLogData.chat) {
    chatLog = chatLogData.chat.chat;
  }
  const formattedChatLog = [];
  let chatMessageSenderId = chatLog[0] ? chatLog[0].senderId : 11;

  let msgGroup = {
    senderId: chatMessageSenderId,
    message: [],
  };
  chatLog.forEach((msg, index) => {
    if (chatMessageSenderId === msg.senderId) {
      msgGroup.message.push({
        time: msg.time,
        msg: msg.message,
        sections: msg.sections,
        feedback: msg.feedback,
        messageId: msg.messageId,
        threadId: chatLogData.contact.threadId,
      });
    } else {
      chatMessageSenderId = msg.senderId;
      formattedChatLog.push(msgGroup);
      msgGroup = {
        senderId: msg.senderId,
        message: [
          {
            time: msg.time,
            msg: msg.message,
            sections: msg.sections,
            feedback: msg.feedback,
            messageId: msg.messageId,
            threadId: chatLogData.contact.threadId,
          },
        ],
      };
    }
    if (index === chatLog.length - 1) formattedChatLog.push(msgGroup);
  });
  return formattedChatLog;
};

export const scrollToBottom = (chatArea, hidden) => {
  if (chatArea.current) {
    if (hidden) {
      chatArea.current.scrollTop = chatArea.current.scrollHeight;
    } else {
      chatArea.current._container.scrollTop =
        chatArea.current._container.scrollHeight;
    }
  }
};


