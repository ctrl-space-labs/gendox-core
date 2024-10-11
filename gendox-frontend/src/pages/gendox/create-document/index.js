import React, { useState, useRef, useEffect } from "react";
import Tooltip from "@mui/material/Tooltip";
import { useRouter } from "next/router";
import Typography from "@mui/material/Typography";
import { StyledCardContent } from "src/utils/styledCardsContent";
import documentService from "src/gendox-sdk/documentService";
import authConfig from "src/configs/auth";
import Icon from "src/@core/components/icon";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import DocumentEdit from "src/views/gendox-components/create-document/DocumentEdit";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import toast from "react-hot-toast";


const CreateDocument = () => {
  const router = useRouter();
  const { organizationId, projectId } = router.query;
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const [documentTitle, setDocumentTitle] = useState("");
  const [documentValue, setDocumentValue] = useState("");
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [titleError, setTitleError] = useState(false); // State for title validation


  const handleGoBack = () => {
    router.push(
      `/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`
    );
  };

  
  const handleSave = async () => {
    if (!documentTitle) {
      setTitleError(true);
      toast.error("Document title is required.");
      return; // Prevent saving if the title is empty
    }

    setTitleError(false);
    setIsCreatingDocument(true);
    try {
      
      // Convert documentValue (EditorState) to plain text
      const plainText = documentValue.getCurrentContent().getPlainText();

      console.log("plainText", plainText);

      // Create a Blob from the plain text
      const blob = new Blob([plainText], { type: "text/plain" });
      const file = new File([blob], `${documentTitle}.txt`, { type: "text/plain" });

      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);

      console.log("formData", formData.get("file"));

      // Upload the document
      await documentService.uploadDocument(organizationId, projectId, formData, storedToken);

      toast.success("Document created successfully");
      router.push(`/gendox/home/?organizationId=${organizationId}&projectId=${projectId}`);

    } catch (error) {
      toast.error("Failed to create document");
      console.error("Error saving document:", error);
    } finally {
      setIsCreatingDocument(false);
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
            variant="h4"
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

      <StyledCardContent
        sx={{
          backgroundColor: "background.paper",
          pt: 3,
          pb: 3,
          mb: 6,
          filter: isCreatingDocument ? "blur(6px)" : "none", // Apply blur during loading
          transition: "filter 0.3s ease",
        }}
      >
        <DocumentEdit
          documentTitle={documentTitle}
          setDocumentTitle={setDocumentTitle}
          documentValue={documentValue}
          setDocumentValue={setDocumentValue}
          titleError={titleError}
        />
      </StyledCardContent>
    </Card>
  );
};

export default CreateDocument;
