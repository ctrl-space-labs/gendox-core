import { useState, useEffect, useRef, useCallback } from "react";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Box from "@mui/material/Box";

// ** Icon Imports
import Icon from "src/@core/components/icon";
import {useIFrameMessageManager} from "src/context/IFrameMessageManagerContext";

// // ** Styled Form
const Form = styled("form")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const SendMsgForm = (props) => {
  // ** Props
  const {
    store,
    dispatch,
    sendMsg,
    organizationId,
    isSending,
    setStatusMessage,
  } = props;
  const iFrameMessageManager = useIFrameMessageManager();

  // ** State
  const [msg, setMsg] = useState("");
  const textFieldRef = useRef(null);

  useEffect(() => {
    if (textFieldRef.current) {
      textFieldRef.current.scrollTop = textFieldRef.current.scrollHeight;
    }
  }, [msg]);

  const simulateStatusUpdates = useCallback(async () => {
      setStatusMessage("Gathering local contacts...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStatusMessage("Searching for related documents...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setStatusMessage("Generating answer...");
  }, []);

  const handleSendMsg = async (e) => {
    e.preventDefault();
    if (store && store.selectedChat && msg.trim().length) {
      simulateStatusUpdates();
      const currentMsg = msg;
      setMsg("");

      try {
        await dispatch(
          sendMsg({
            ...store.selectedChat,
            message: currentMsg,
            organizationId,
            iFrameMessageManager
          })
        );
        setStatusMessage("");
      } catch (error) {
        setStatusMessage("Failed to send message.");
      } finally {
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMsg(e);
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      setMsg((prevMsg) => prevMsg + "\n\n");
    }
  };

  return (
    <Form onSubmit={handleSendMsg}>
      <Box sx={{ flexGrow: 1, mr: 2, marginBottom: "0.5rem" }}>
        <TextField
          fullWidth
          value={msg}
          size="small"
          placeholder="Type your message here…"
          multiline
          maxRows={5}
          inputRef={textFieldRef} // Reference for the textarea
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSending}
                  sx={{
                    minWidth: "fit-content",
                    padding: "6px 12px",
                    fontSize: "0.875rem",
                    marginLeft: "4px",
                    boxShadow: "none",
                  }}
                >
                  Send
                </Button>
              </InputAdornment>
            ),
            sx: {
              padding: "10px 15px",
              fontSize: "1rem",
              backgroundColor: "background.paper",
              borderRadius: "0.5rem",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
            },
          }}
        />
      </Box>
    </Form>
  );
};

export default SendMsgForm;
