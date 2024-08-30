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
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";
import toast from "react-hot-toast";
import {
  fetchDocument,
  updateSectionsOrder,
} from "src/store/apps/activeDocument/activeDocument";
import Editor from "src/views/gendox-components/documents-components/Editor";
import { markdownToDraft } from "markdown-draft-js";
import ReactDraftWysiwyg from "src/@core/components/react-draft-wysiwyg";
import { EditorWrapper } from "src/@core/styles/libs/react-draft-wysiwyg";

const DocumentEdit = ({ section, isMinimized }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const initialContent = EditorState.createWithContent(
    ContentState.createFromText(section.sectionValue || "")
  );
  const initialTitle = section.documentSectionMetadata.title;
  const [sectionValue, setSectionValue] = useState(initialContent);
  const [sectionTitle, setSectionTitle] = useState(initialTitle);
  const [confirmDelete, setConfirmDelete] = useState(false);

  console.log("sectionValue", sectionValue.getCurrentContent().getPlainText());
  console.log("sectionTitle", sectionTitle);

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
      </Box>
      <EditorWrapper>
        <ReactDraftWysiwyg
          editorState={sectionValue}
          onEditorStateChange={(editorState) => setSectionValue(editorState)}
          placeholder="Message"
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
