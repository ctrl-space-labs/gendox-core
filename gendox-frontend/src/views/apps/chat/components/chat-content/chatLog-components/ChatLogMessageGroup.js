import { useMemo } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import CustomAvatar from "src/@core/components/mui/avatar";
import ChatLogMessage from "src/views/apps/chat/components/chat-content/chatLog-components/chatLog-message-group/ChatLogMessage";
import { generateIdenticon } from "src/utils/identiconUtil";
import { getInitials } from "src/@core/utils/get-initials";

const ChatLogMessageGroup = ({ messageData, data }) => {
  const isSender = messageData.senderId === data.userContact.id;

  const identiconSrc = useMemo(
    () => generateIdenticon(data.userContact.id),
    [data.userContact.email]
  );

  const { fullName, avatarSrc, fallbackText } = useMemo(() => {
    const contactName = !isSender
      ? data.contact?.fullName
      : data.userContact?.fullName;
    return {
      fullName: contactName || "Unknown User", // Tooltip text
      avatarSrc: isSender ? identiconSrc : null, // Show identicon if sender
      fallbackText: !isSender ? getInitials(contactName) : null, // Initials for the recipient
    };
  }, [
    isSender,
    data.contact?.fullName,
    data.userContact?.fullName,
    identiconSrc,
  ]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: !isSender ? "row" : "row-reverse",
        mb: 9.75,
      }}
    >
      <Box>
        <Tooltip title={fullName} arrow>
          <CustomAvatar
            skin="light"
            color={
              data.contact.avatarColor ? data.contact.avatarColor : undefined
            }
            sx={{
              width: "2rem",
              height: "2rem",
              fontSize: "0.875rem",
              ml: isSender ? 4 : undefined,
              mr: !isSender ? 4 : undefined,
            }}
            src={avatarSrc}
          >
            {!avatarSrc && fallbackText}
          </CustomAvatar>
        </Tooltip>
      </Box>

      <Box
        className="chat-body"
        sx={{ maxWidth: ["calc(100% - 5.75rem)", "75%", "65%"] }}
      >
        {messageData.message.map((message, index, { length }) => (
          <ChatLogMessage key={index} message={message} isSender={isSender} />
        ))}
      </Box>
    </Box>
  );
};

export default ChatLogMessageGroup;
