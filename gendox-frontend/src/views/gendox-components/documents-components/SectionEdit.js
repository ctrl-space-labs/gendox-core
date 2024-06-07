import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import Tooltip from "@mui/material/Tooltip";
import { useRouter } from "next/router";
import { EditorState, ContentState } from "draft-js";
import ReactDraftWysiwyg from "src/@core/components/react-draft-wysiwyg";
import { EditorWrapper } from "src/@core/styles/libs/react-draft-wysiwyg";
import documentService from "src/gendox-sdk/documentService";
import authConfig from "src/configs/auth";
import Icon from "src/@core/components/icon";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const SectionEdit = ({ section }) => {
  
  const router = useRouter();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const project = useSelector((state) => state.activeProject.projectDetails);
  const document = useSelector((state) => state.activeDocument.document);
  const [activeSection, setActiveSection] = useState(section);
  const [isMinimized, setIsMinimized] = useState(false);

  const initialContent = EditorState.createWithContent(
    ContentState.createFromText(section.sectionValue)
  );
  const initialTitle = section.documentSectionMetadata.title;
  const [sectionValue, setSectionValue] = useState(initialContent);
  const [sectionTitle, setSectionTitle] = useState(initialTitle);

  const lastSavedValue = useRef(sectionValue);
  const lastSavedTitle = useRef(sectionTitle);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (
        sectionValue !== lastSavedValue.current ||
        sectionTitle !== lastSavedTitle.current
      ) {
        handleSave();
        lastSavedValue.current = sectionValue;
        lastSavedTitle.current = sectionTitle;
      }
    }, 3000); // check every 3 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [sectionValue, sectionTitle]);

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleDelete = async () => {
    console.log("Delete section");
  };

  const handleRestore = () => {
    console.log("Restore section");
    handleSave();
    setSectionValue(initialContent);
    setSectionTitle(initialTitle);
  };

  const handleSave = async () => {
    // e.preventDefault(); // Prevent default form submission

    const updatedSectionPayload = {
      ...activeSection,
      sectionValue: sectionValue.getCurrentContent().getPlainText(),
      documentDTO: document,
      documentSectionMetadata: {
        ...activeSection.documentSectionMetadata,
        title: sectionTitle,
      },
    };

    try {
      const response = await documentService.updateDocumentSection(
        document.id,
        section.id,
        updatedSectionPayload,
        storedToken
      );
      console.log("Section updated", response);
      setActiveSection(response.data);
      // const path = `/gendox/document-instance?documentId=${document.id}`;
      // router.push(path);
    } catch (error) {
      console.error("Error updating section", error);
    }
  };

  const EditorToolbar = () => (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Tooltip title="Minimize ">
        <IconButton
          sx={{ p: 1, color: "primary.main" }}
          onClick={handleMinimize}
        >
          <Icon icon="mdi:minus" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Restore">
        <IconButton
          sx={{ p: 1, color: "primary.main" }}
          onClick={handleRestore}
        >
          <Icon icon="mdi:restore" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton sx={{ p: 1, color: "primary.main" }} onClick={handleDelete}>
          <Icon icon="mdi:delete" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box
      anchor="bottom"
      variant="temporary"
      sx={{
        top: "auto",
        left: "auto",
        bottom: "1.5rem",
        display: "block",
        zIndex: (theme) => `${theme.zIndex.drawer} + 1`,
        "& .MuiDrawer-paper": {
          borderRadius: 1,
          position: "static",
        },
      }}
      // onMouseLeave={handleSave}
    >
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
        <EditorToolbar />
      </Box>
      {!isMinimized && (
        <EditorWrapper>
          <ReactDraftWysiwyg
            editorState={sectionValue}
            onEditorStateChange={(editorState) => setSectionValue(editorState)}
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
      )}
    </Box>
  );
};

export default SectionEdit;
