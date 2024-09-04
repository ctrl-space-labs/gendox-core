import Box from "@mui/material/Box";
import CustomAvatar from "src/@core/components/mui/avatar";
import { getInitials } from "src/@core/utils/get-initials";
import ChatLogMessage from "src/views/apps/chat/chatLog-components/ChatLogMessage";


const ChatLogMessageGroup = ({ messageData, data }) => {
  const isSender = messageData.senderId === data.userContact.id;

  
  

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: !isSender ? "row" : "row-reverse",
        mb: 9.75,       
      }}
    >
      <div>
        <CustomAvatar
          skin="light"
          color={data.contact.avatarColor ? data.contact.avatarColor : undefined}
          sx={{
            width: "2rem",
            height: "2rem",
            fontSize: "0.875rem",
            ml: isSender ? 4 : undefined,
            mr: !isSender ? 4 : undefined,
          }}
          {...(data.contact.avatar && !isSender
            ? {
                src: data.contact.avatar,
                alt: data.contact.fullName,
              }
            : {})}
          {...(isSender
            ? {
                src: data.userContact.avatar,
                alt: data.userContact.fullName,
              }
            : {})}
        >
          {data.contact.avatarColor ? getInitials(data.contact.fullName) : null}
        </CustomAvatar>
      </div>

      <Box
        className="chat-body"
        sx={{ maxWidth: ["calc(100% - 5.75rem)", "75%", "65%"] }}
      >
        {messageData.message.map((message, index, { length }) => (
          <ChatLogMessage
            key={index}
            message={message}
            isSender={isSender}
            
          />
        ))}
      </Box>
    </Box>
  );
};

export default ChatLogMessageGroup;
