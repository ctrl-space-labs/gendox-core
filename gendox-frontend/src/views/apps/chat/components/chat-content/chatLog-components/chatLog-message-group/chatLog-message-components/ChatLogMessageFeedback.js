import Box from "@mui/material/Box";
import Icon from "src/@core/components/icon";

const ChatLogMessageFeedback = ({ feedback }) => {

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        "& svg": {
          mr: 2,
          color:
            feedback.isSent && feedback.isDelivered
              ? feedback.isSeen
                ? "success.main"
                : "text.secondary"
              : "text.secondary",
        },
      }}
    >
      <Icon
        icon={
          feedback.isSent && feedback.isDelivered
            ? "mdi:check-all"
            : "mdi:check"
        }
        fontSize="1rem"
      />
    </Box>
  );
};


export default ChatLogMessageFeedback;
