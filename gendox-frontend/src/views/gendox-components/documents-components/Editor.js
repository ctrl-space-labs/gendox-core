// React and MUI imports
import { useState } from "react";
import Box from "@mui/material/Box";
import Input from "@mui/material/Input";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import { EditorState } from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

// Icon and Custom Components
import Icon from "src/@core/components/icon";
import ReactDraftWysiwyg from "src/@core/components/react-draft-wysiwyg";
import { EditorWrapper } from "src/@core/styles/libs/react-draft-wysiwyg";

// Util function
import { getInitials } from "src/@core/utils/get-initials";

const Editor = (props) => {
  // ** Props
  const { value, title, mdAbove, composeOpen, composePopupWidth, toggleComposeOpen } = props;

  // ** States
  const [emailTo, setEmailTo] = useState([]);
  const [subjectValue, setSubjectValue] = useState(value);
  const [messageValue, setMessageValue] = useState(EditorState.createEmpty());

  const handleDelete = () => {};

  const handlePopupClose = () => {
    toggleComposeOpen();
    setEmailTo([]);
    setSubjectValue("");
    setMessageValue(EditorState.createEmpty());
  };

  const handleMinimize = () => {
    toggleComposeOpen();
    setEmailTo(emailTo);
    setMessageValue(messageValue);
    setSubjectValue(subjectValue);
  };

  // JSX Structure breakdown
  const EditorToolbar = () => (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <IconButton
        sx={{ p: 1, mr: 2, color: "action.active" }}
        onClick={() => toggleComposeOpen()}
      >
        <Icon icon="mdi:minus" fontSize={20} />
      </IconButton>
      <IconButton
        sx={{ p: 1, color: "action.active" }}
        onClick={handlePopupClose}
      >
        <Icon icon="mdi:close" fontSize={20} />
      </IconButton>
    </Box>
  );

  return (
    <Box
      anchor="bottom"            
      sx={{
        top: "auto",
        left: "auto",
        right: mdAbove ? "1.5rem" : "1rem",
        bottom: "1.5rem",
        display: "block",
        zIndex: (theme) => `${theme.zIndex.drawer} + 1`,
        "& .MuiDrawer-paper": {
          borderRadius: 1,
          position: "static",
          width: composePopupWidth,
        },
      }}
    >
      <Box
        sx={{
          py: 1,
          px: 4,
          display: "flex",
          alignItems: "center",
          // borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <InputLabel sx={{ mr: 3, color: "text.disabled" }}>Title: </InputLabel>

        <Input
          fullWidth
          value={subjectValue}
          id="title-input"
          onChange={(e) => setSubjectValue(e.target.value)}
          sx={{
            "&:before, &:after": { display: "none" },
            "& .MuiInput-input": { py: 1.875 },
          }}
        />
        <EditorToolbar />
      </Box>
      <EditorWrapper
        sx={{
          "& .rdw-editor-wrapper": { border: "0 !important" },
          "& .rdw-editor-toolbar": { p: "0.35rem 1rem !important" },
        }}
      >
        <ReactDraftWysiwyg
          editorState={messageValue}
          onEditorStateChange={(editorState) => setMessageValue(editorState)}
          placeholder="Message"
          toolbar={{
            options: ["inline", "textAlign"],
            inline: {
              inDropdown: false,
              options: ["bold", "italic", "underline", "strikethrough"],
            },
          }}
        />
      </EditorWrapper>
    </Box>
  );
};

export default Editor;
