import Box from "@mui/material/Box";
import Icon from "src/@core/components/icon";

const ChatLogMessageFeedback = ({ isSender, feedback }) => {
  if (!isSender) return null;

  if (feedback.isSent && !feedback.isDelivered) {
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          "& svg": { mr: 2, color: "text.secondary" },
        }}
      >
        <Icon icon="mdi:check" fontSize="1rem" />
      </Box>
    );
  } else if (feedback.isSent && feedback.isDelivered) {
    return (
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          "& svg": {
            mr: 2,
            color: feedback.isSeen ? "success.main" : "text.secondary",
          },
        }}
      >
        <Icon icon="mdi:check-all" fontSize="1rem" />
      </Box>
    );
  } else {
    return null;
  }
};

export default ChatLogMessageFeedback;
