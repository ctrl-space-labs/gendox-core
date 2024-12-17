import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  convertFromRaw,
  convertToRaw,
  ContentState,
  EditorState,
} from "draft-js";
import Box from "@mui/material/Box";
import { InputLabel } from "@mui/material";
import Input from "@mui/material/Input";
import { markdownToDraft } from "markdown-draft-js";
import ReactDraftWysiwyg from "src/@core/components/react-draft-wysiwyg";
import { EditorWrapper } from "src/@core/styles/libs/react-draft-wysiwyg";

const DocumentEdit = ({
  documentTitle,
  setDocumentTitle,
  documentValue,
  setDocumentValue,
  titleError,
}) => {
  const initialContent = EditorState.createWithContent(
    ContentState.createFromText("")
  );

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
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <InputLabel
            sx={{
              mr: 3,
              color: titleError ? "error.main" : "primary.main",
              whiteSpace: "nowrap",
              flexShrink: 0,
              minWidth: "80px",
            }}
          >
            Name: {"  "}
            {titleError && (
              <span style={{ color: "error.main", fontSize: "0.8rem" }}>
                <sup
                  style={{
                    fontSize: "0.7rem",
                    position: "relative",
                    top: "-0.3em",
                  }}
                >
                  *
                {" "}
                required
                </sup>
              </span>
            )}
          </InputLabel>
          <Input
            fullWidth
            value={documentTitle}
            id="title-input"
            onChange={(e) => setDocumentTitle(e.target.value)}
            sx={{
              flexGrow: 1,
              "&:before, &:after": { display: "none" },
              "& .MuiInput-input": { py: 1.875 },
            }}
          />
        </Box>
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
