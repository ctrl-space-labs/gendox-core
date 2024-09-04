// ** React Imports
import { useState, useEffect, useRef } from "react";

// ** MUI Imports
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";

// ** Icon Imports
import Icon from "src/@core/components/icon";

// // ** Styled Form
const Form = styled("form")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const SendMsgForm = (props) => {
  // ** Props
  const { store, dispatch, sendMsg, organizationId } = props;

  // ** State
  const [msg, setMsg] = useState("");
  const textFieldRef = useRef(null);

  useEffect(() => {
    if (textFieldRef.current) {
      textFieldRef.current.scrollTop = textFieldRef.current.scrollHeight;
    }
  }, [msg]);

  const handleSendMsg = (e) => {
    e.preventDefault();
    if (store && store.selectedChat && msg.trim().length) {
      dispatch(
        sendMsg({ ...store.selectedChat, message: msg, organizationId })
      );
    }
    setMsg("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (!e.shiftKey) {
        // If Enter is pressed without Shift, send the message
        e.preventDefault();
        handleSendMsg(e);
      }
      e.preventDefault();
      setMsg((prevMsg) => prevMsg + "\n");
    }
  };

  return (
    <Form onSubmit={handleSendMsg}>
      <Box
        sx={{
          flexGrow: 1,
          mr: 2,          
        }}
      >
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
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
              position: "absolute",
              bottom: 0,
            },
          }}
        />
      </Box>
    </Form>
  );
};


export default SendMsgForm;
