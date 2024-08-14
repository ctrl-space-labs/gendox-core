import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Tooltip from "@mui/material/Tooltip";
import { useRouter } from "next/router";
import { EditorState, ContentState } from "draft-js";
import ReactDraftWysiwyg from "src/@core/components/react-draft-wysiwyg";
import { EditorWrapper } from "src/@core/styles/libs/react-draft-wysiwyg";
import documentService from "src/gendox-sdk/documentService";
import authConfig from "src/configs/auth";
import Icon from "src/@core/components/icon";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import toast from "react-hot-toast";
import {
  fetchDocument,
  updateSectionsOrder,
} from "src/store/apps/activeDocument/activeDocument";

const SectionEdit = ({ section, isMinimized }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const project = useSelector((state) => state.activeProject.projectDetails);
  const document = useSelector((state) => state.activeDocument.document);
  const [activeSection, setActiveSection] = useState(section);
  const [isSectionMinimized, setIsSectionMinimized] = useState(isMinimized);

  useEffect(() => {
    setIsSectionMinimized(isMinimized);
  }, [isMinimized]);

  const initialContent = EditorState.createWithContent(
    ContentState.createFromText(section.sectionValue || "")
  );
  const initialTitle = section.documentSectionMetadata.title;
  const [sectionValue, setSectionValue] = useState(initialContent);
  const [sectionTitle, setSectionTitle] = useState(initialTitle);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    }, 1000); // check every 3 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [sectionValue, sectionTitle]);

  const handleMinimize = () => {
    setIsSectionMinimized(!isSectionMinimized);
  };

  const handleDelete = async () => {
    try {
      const response = await documentService.deleteDocumentSection(
        document.id,
        section.id,
        storedToken
      );
      dispatch(fetchDocument({ documentId: document.id, storedToken })).then(
        () => {
          dispatch(updateSectionsOrder({ documentId:document.id, storedToken }));
          toast.success("Document Section deleted successfully");
        }
      );
    } catch (error) {
      console.error("Error deleting section", error);
      toast.error("Failed to delete Document Section");
    }
    setConfirmDelete(false);
  };

  const handleDeleteConfirmOpen = () => {
    setConfirmDelete(true);
  };

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false);
  };

  const handleRestore = () => {
    handleSave();
    setSectionValue(initialContent);
    setSectionTitle(initialTitle);
  };

  const handleSave = async () => {

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
      setActiveSection(response.data);      
    } catch (error) {
      console.error("Error updating section", error);
    }
  };

  const EditorToolbar = () => (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Tooltip title={isSectionMinimized ? "Maximize" : "Minimize"}>
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
        <IconButton
          sx={{ p: 1, color: "primary.main" }}
          onClick={handleDeleteConfirmOpen}
        >
          <Icon icon="mdi:delete" />
        </IconButton>
      </Tooltip>
    </Box>
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
      {!isSectionMinimized && (
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
            editorStyle={{
              height: "25rem", // Set fixed height for the editor
              overflow: "auto", // Enable scrolling
              padding: "0 1rem", // Add padding for better readability
            }}
          />
        </EditorWrapper>
      )}
      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDelete}
        title="Confirm Deletion Document Section"
        // contentText={`Are you sure you want to delete this section? This action cannot be undone.`}
        contentText={`Are you sure you want to delete ${
          sectionTitle || "this section"
        } from this document? This action cannot be undone.`}
        confirmButtonText="Delete Section"
        cancelButtonText="Cancel"
      />
    </Box>
  );
};

export default SectionEdit;
