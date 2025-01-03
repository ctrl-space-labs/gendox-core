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
import {useIFrameMessageManager} from "../../../context/IFrameMessageManagerContext";

// // ** Styled Form
const Form = styled("form")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const SendMsgForm = (props) => {
  // ** Props
  const { store, dispatch, sendMsg, organizationId } = props;
  const iFrameMessageManager = useIFrameMessageManager();

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
        sendMsg({ ...store.selectedChat, message: msg, organizationId, iFrameMessageManager })
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
          "margin-bottom": "0.5rem",
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
              borderRadius: "0.5rem",  // Set the border-radius here
              boxShadow: "rgba(20, 21, 33, 0.2) 0px 2px 1px -1px, rgba(20, 21, 33, 0.14) 0px 1px 1px 0px, rgba(20, 21, 33, 0.12) 0px 1px 3px 0px",
              // overflow: "hidden",
              // position: "absolute",
              // bottom: 0,
              // Target the fieldset to remove the border color
              "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "transparent", // Removes border in default state
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "transparent", // Removes border in focus state
              },
            },
          }}
        />
      </Box>
    </Form>
  );
};


export default SendMsgForm;
