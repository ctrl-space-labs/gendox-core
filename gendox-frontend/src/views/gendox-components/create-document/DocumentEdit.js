import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  convertFromRaw,
  convertToRaw,
  ContentState,
  EditorState,
} from "draft-js";
import documentService from "src/gendox-sdk/documentService";
import authConfig from "src/configs/auth";
import Box from "@mui/material/Box";
import { InputLabel } from "@mui/material";
import Input from "@mui/material/Input";
import { markdownToDraft } from "markdown-draft-js";
import ReactDraftWysiwyg from "src/@core/components/react-draft-wysiwyg";
import { EditorWrapper } from "src/@core/styles/libs/react-draft-wysiwyg";

const DocumentEdit = ({ documentTitle, setDocumentTitle, documentValue, setDocumentValue }) => {
    
  const initialContent = EditorState.createWithContent(
    ContentState.createFromText("")
  );



  console.log("sectionValue", documentValue);
  console.log("sectionTitle", documentTitle);

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
          <InputLabel sx={{ mr: 3, color: "primary.main" }}>Name: </InputLabel>
        </div>
        <Input
          fullWidth
          value={documentTitle}
          id="title-input"
          onChange={(e) => setDocumentTitle(e.target.value)}
          sx={{
            "&:before, &:after": { display: "none" },
            "& .MuiInput-input": { py: 1.875 },
          }}
        />
      </Box>
      <EditorWrapper>
        <ReactDraftWysiwyg
          editorState={documentValue}
          onEditorStateChange={(editorState) => setDocumentValue(editorState)}
          placeholder="Start typing your document..."
          editorStyle={{
            height: "25rem", // Set fixed height for the editor
            overflow: "auto", // Enable scrolling
            padding: "0 1rem", // Add padding for better readability

          }}
        />
      </EditorWrapper>
    </Box>
  );
};

export default DocumentEdit;
