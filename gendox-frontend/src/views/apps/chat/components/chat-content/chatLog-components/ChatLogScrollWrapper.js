import Box from "@mui/material/Box";
import PerfectScrollbarComponent from "react-perfect-scrollbar";
import { styled } from "@mui/material/styles";

const PerfectScrollbar = styled(PerfectScrollbarComponent)(({ theme }) => ({
  padding: theme.spacing(5),
}));

const ChatLogScrollWrapper = ({ children, hidden, chatArea }) => {
  if (hidden) {
    return (
      <Box ref={chatArea} sx={{ p: 5, height: "100%", overflowY: "auto", overflowX: "hidden" }}>
        {children}
      </Box>
    );
  } else {
    return (
      <PerfectScrollbar ref={chatArea} options={{ wheelPropagation: false }}>
        {children}
      </PerfectScrollbar>
    );
  }
};

export default ChatLogScrollWrapper;
