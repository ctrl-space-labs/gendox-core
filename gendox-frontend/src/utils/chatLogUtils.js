export const formattedChatData = (chatLogData) => {
    let chatLog = [];
    if (chatLogData.chat) {
      chatLog = chatLogData.chat.chat;
    }
    const formattedChatLog = [];
    let chatMessageSenderId = chatLog[0] ? chatLog[0].senderId : 11;
  
    let msgGroup = {
      senderId: chatMessageSenderId,
      messages: [],
    };
    chatLog.forEach((msg, index) => {
      if (chatMessageSenderId === msg.senderId) {
        msgGroup.messages.push({
          time: msg.time,
          msg: msg.message,
          sections: msg.sections,
          feedback: msg.feedback,
        });
      } else {
        chatMessageSenderId = msg.senderId;
        formattedChatLog.push(msgGroup);
        msgGroup = {
          senderId: msg.senderId,
          messages: [
            {
              time: msg.time,
              msg: msg.message,
              sections: msg.sections,
              feedback: msg.feedback,
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









export const fakeData = [
    {
      sectionId: "5227bb48-6b6c-4a22-8312-9395bd61650d",
      messageId: "04931eb3-4d57-4d77-bdf2-86f2eb20518f",
      documentId: "fab1a9d3-dfdb-4960-8da8-8d243c437c7b",
      sectionUrl: null,
      userName: "Chris Sekas",
      organizationName: "Ctrl+space Labs",
      isccCode: "384273cf-d152-4ad2-ac1c-b07f1f05dfb7",
      createdAt: "2024-05-30T08:21:25.303731Z",
      threadId: "90cb69ea-39f2-45fb-8451-f8c4fafef6bb",
      policyTypeName: null,
      policyValue: "",
    },
    {
      sectionId: "8892b694-3e73-44fd-be23-9f5951f01d50",
      messageId: "04931eb3-4d57-4d77-bdf2-86f2eb20518f",
      documentId: "f7c7acce-ea10-46be-b057-8848c19b9daa",
      sectionUrl: null,
      userName: "Chris Sekas",
      organizationName: "Ctrl+space Labs",
      isccCode: "db9af8c8-5656-4b79-ba3c-3cb7fceff9db",
      createdAt: "2024-05-30T08:21:25.303731Z",
      threadId: "90cb69ea-39f2-45fb-8451-f8c4fafef6bb",
      policyTypeName: "ATTRIBUTION_POLICY",
      policyValue: "OWNER_NAME, ORIGINAL DOCUMENT",
    },
    {
      sectionId: "dc5ac64c-bfd3-4b81-8cdf-94950575a412",
      messageId: "04931eb3-4d57-4d77-bdf2-86f2eb20518f",
      documentId: "a71e8822-cd85-4b92-b6cd-1148769d9fbd",
      sectionUrl: null,
      userName: "Chris Sekas",
      organizationName: "Ctrl+space Labs",
      isccCode: "621dc625-4fb9-426a-ac6b-968916a24911",
      createdAt: "2024-05-30T08:21:25.303731Z",
      threadId: "90cb69ea-39f2-45fb-8451-f8c4fafef6bb",
      policyTypeName: null,
      policyValue: "",
    },
    {
      sectionId: "10f4a363-e0e8-46e1-9db4-e998084bada0",
      messageId: "04931eb3-4d57-4d77-bdf2-86f2eb20518f",
      documentId: "32776578-b7b7-4712-9fe7-354b100984d2",
      sectionUrl: null,
      userName: "Chris Sekas",
      organizationName: "Ctrl+space Labs",
      isccCode: "df9c832b-9d57-4896-a5a9-64358b8e455a",
      createdAt: "2024-05-30T08:21:25.303731Z",
      threadId: "90cb69ea-39f2-45fb-8451-f8c4fafef6bb",
      policyTypeName: null,
      policyValue: "OWNER_NAME, ORIGINAL DOCUMENT",
    },
    {
      sectionId: "2db687f4-ad7f-410a-abcf-d51a29ce450a",
      messageId: "04931eb3-4d57-4d77-bdf2-86f2eb20518f",
      documentId: "dedda157-f314-45b9-b36b-62080c781698",
      sectionUrl: null,
      userName: "Chris Sekas",
      organizationName: "Ctrl+space Labs",
      isccCode: "b5c2e91b-4230-4037-930b-59e8bea079f2",
      createdAt: "2024-05-30T08:21:25.303731Z",
      threadId: "90cb69ea-39f2-45fb-8451-f8c4fafef6bb",
      policyTypeName: "ATTRIBUTION_POLICY",
      policyValue: "OWNER_NAME, ORIGINAL DOCUMENT",
    },
  ];