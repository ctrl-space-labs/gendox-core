
import React from "react";
import { useState } from "react";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Icon from "src/@core/components/icon";
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import ReactDraftWysiwyg from "src/@core/components/react-draft-wysiwyg";
import { EditorWrapper } from "src/@core/styles/libs/react-draft-wysiwyg";
import { EditorState, convertToRaw } from "draft-js";
// import draftToMarkdown from 'draftjs-to-markdown/lib/draftjs-to-markdown';
// import draftToMarkdown from 'draftjs-to-markdown';
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const EditorToolbar = ({
  isSectionMinimized,
  handleMinimize,
  handleRestore,
  handleDeleteConfirmOpen,
}) => (
  <Box sx={{ display: "flex", alignItems: "center" }}>
    <Tooltip title={isSectionMinimized ? "Maximize" : "Minimize"}>
      <IconButton sx={{ p: 1, color: "primary.main" }} onClick={handleMinimize}>
        <Icon icon={isSectionMinimized ? "mdi:arrow-expand" : "mdi:arrow-collapse"}/>
      </IconButton>
    </Tooltip>
    {/* <Tooltip title="Restore">
      <IconButton sx={{ p: 1, color: "primary.main" }} onClick={handleRestore}>
        <Icon icon="mdi:restore" />
      </IconButton>
    </Tooltip> */}
    <Tooltip title="Delete">
      <IconButton
        sx={{ p: 1, color: "primary.main" }}
        onClick={handleDeleteConfirmOpen}
      >
        <Icon icon="mdi:delete" />
      </IconButton>
    </Tooltip>
  </Box>
);

const EditorConverToMarkdown = ({
  sectionValue,
  setSectionValue,
  sectionTitle,
  setSectionTitle,
  isSectionMinimized,
  handleMinimize,
  handleRestore,
  handleDeleteConfirmOpen,
}) => {

//   const rawContentState = convertToRaw(sectionValue.getCurrentContent());
// const markup = draftToMarkdown(contentState, hashConfig, customEntityTransform, config);
  const [markdownValue, setMarkdownValue] = useState("");

  // const onEditorStateChange = (editorState) => {
  //   setSectionValue(editorState);
  //   const markdown = draftToMarkdown(
  //     convertToRaw(editorState.getCurrentContent())
  //   );
  //   setMarkdownValue(markdown);
  //   // setSectionValue(markdown);
  // };

  const onEditorStateChange = (editorState) => {
    // Update the editor state
    setSectionValue(editorState);
    
    // Convert to Markdown (without setting it back to the editor state)
    // const markdown = draftToMarkdown(convertToRaw(editorState.getCurrentContent()));
    // console.log("Converted Markdown:", markdown);
  };

  

  return (
    <Box>
      <Box
        sx={{
          py: 1,
          px: 4,
          display: "flex",
          alignItems: "center",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <div>
          <InputLabel sx={{ mr: 3, color: "primary.main" }}>Title: </InputLabel>
        </div>
        <Input
          fullWidth
          value={sectionTitle}
          id="title-input"
          onChange={(e) => setSectionTitle(e.target.value)}
          sx={{
            "&:before, &:after": { display: "none" },
            "& .MuiInput-input": { py: 1.875 },
          }}
        />
        <EditorToolbar
          isSectionMinimized={isSectionMinimized}
          handleMinimize={handleMinimize}
          handleRestore={handleRestore}
          handleDeleteConfirmOpen={handleDeleteConfirmOpen}
        />
      </Box>
      {!isSectionMinimized && (
        <EditorWrapper>
          <ReactDraftWysiwyg
            editorState={sectionValue}
            // onEditorStateChange={(editorState) => setSectionValue(editorState)}
            onEditorStateChange={onEditorStateChange}
            placeholder="Message"
            editorStyle={{
              height: "25rem", // Set fixed height for the editor
              overflow: "auto", // Enable scrolling
              padding: "0 1rem", // Add padding for better readability
            }}
          />
        </EditorWrapper>
      )}
    </Box>
  );
};

export default EditorConverToMarkdown;
