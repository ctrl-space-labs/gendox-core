import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import Tooltip from "@mui/material/Tooltip";
import { useRouter } from "next/router";
import { styled } from "@mui/material/styles";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { EditorState, ContentState } from "draft-js";
import ReactDraftWysiwyg from "src/@core/components/react-draft-wysiwyg";
import { StyledCardContent } from "src/utils/styledCardsContent";
import { EditorWrapper } from "src/@core/styles/libs/react-draft-wysiwyg";
import documentService from "src/gendox-sdk/documentService";
import authConfig from "src/configs/auth";
import Icon from "src/@core/components/icon";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import SectionEdit from "src/views/gendox-components/documents-components/SectionEdit";
import DocumentEdit from "src/views/gendox-components/create-document/DocumentEdit";
import Input from "@mui/material/Input";
import InputLabel from "@mui/material/InputLabel";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";



const CreateDocument = () => {
  const router = useRouter();
  const { organizationId, projectId } = router.query;
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );


  const [documentTitle, setDocumentTitle] = useState("");
  const [documentValue, setDocumentValue] = useState("");

  

  const handleGoBack = () => {
    router.push(`/gendox/home?organizationId=${organizationId}&projectId=${projectId}`);
  };

  const section = {
    sectionValue: "",
    id: 1,
    documentSectionMetadata: {
      title: "",
    },
  };


  const handleSave = async () => {
    console.log("Saving document...");

    
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
        sx={{ backgroundColor: "background.paper", pt: 3, pb: 3, mb: 6 }}
      >
        <DocumentEdit
          section={section}
          isMinimized={false}
              />
       
      </StyledCardContent>
    </Card>
  );
};

export default CreateDocument;
