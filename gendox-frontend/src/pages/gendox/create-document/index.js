import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import Tooltip from "@mui/material/Tooltip";
import { useRouter } from "next/router";
import { styled } from "@mui/material/styles";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { EditorState, ContentState } from "draft-js";
import ReactDraftWysiwyg from "src/@core/components/react-draft-wysiwyg";
import { EditorWrapper } from "src/@core/styles/libs/react-draft-wysiwyg";
import documentService from "src/gendox-sdk/documentService";
import authConfig from "src/configs/auth";
import Icon from "src/@core/components/icon";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  paddingTop: `${theme.spacing(10)} !important`,
  paddingBottom: `${theme.spacing(8)} !important`,
  [theme.breakpoints.up("sm")]: {
    paddingLeft: `${theme.spacing(20)} !important`,
    paddingRight: `${theme.spacing(20)} !important`,
  },
}));

const CreateDocument = () => {
  const router = useRouter();
  const { organizationId, projectId } = router.query;
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const [isMinimized, setIsMinimized] = useState(false);

  const [documentTitle, setDocumentTitle] = useState("");
  const [documentValue, setDocumentValue] = useState("");

  const lastSavedValue = useRef(documentValue);
  const lastSavedTitle = useRef(documentTitle);

  const handleGoBack = () => {
    router.push(`/gendox/home?organizationId=${organizationId}&projectId=${projectId}`);
  };

  const handleDelete = async () => {
    console.log("Delete section");
  };

  const handleRestore = () => {
    console.log("Restore section");
    handleSave();
    setDocumentValue(initialContent);
    setDocumentTitle(initialTitle);
  };

  const handleSave = async () => {
    // e.preventDefault(); // Prevent default form submission

    const updatedSectionPayload = {
      ...activeSection,
      sectionValue: documentValue.getCurrentContent().getPlainText(),
      documentDTO: document,
      documentSectionMetadata: {
        ...activeSection.documentSectionMetadata,
        title: documentTitle,
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

  
  return (
    <Card sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
      <StyledCardContent sx={{ backgroundColor: "background.paper" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h3"
            sx={{ mb: 6, fontWeight: 600, textAlign: "left" }}
          >
            Create New Document
          </Typography>

          <Box sx={{ display: "inline-flex", gap: 1 }}>
            {" "}
            {/* Adjusts the gap between the icons */}
            <Tooltip title="Back">
              <IconButton
                onClick={handleGoBack}
                sx={{
                  mb: 6,
                  width: "auto",
                  height: "auto",
                  color: "primary.main",
                }}
              >
                <Icon icon="mdi:arrow-left-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save Document">
              <IconButton
                onClick={handleSave}
                sx={{
                  mb: 6,
                  width: "auto",
                  height: "auto",
                  color: "primary.main",
                }}
              >
                <Icon icon="mdi:content-save-outline" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </StyledCardContent>
      <Box sx={{ height: 20 }} />
      {/* ************************************** *************************** */}
      <StyledCardContent
        sx={{ backgroundColor: "background.paper", pt: 3, pb: 3, mb: 6 }}
      >
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
              <InputLabel sx={{ mr: 3, color: "primary.main" }}>
                Document Title:{" "}
              </InputLabel>
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
          {!isMinimized && (
            <EditorWrapper>
              <ReactDraftWysiwyg
                editorState={documentValue}
                onEditorStateChange={(editorState) =>
                  setDocumentValue(editorState)
                }
                placeholder="Document Value"
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
      </StyledCardContent>
    </Card>
  );
};

export default CreateDocument;
