import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  Typography,
} from "@mui/material";

import authConfig from "src/configs/auth";
import SectionCard from "src/views/gendox-components/documents-components/SectionCard";
import documentService from "src/gendox-sdk/documentService";

const formatDocumentTitle = (remoteUrl) => {
  if (!remoteUrl) return ""; // Return an empty string if remoteUrl is undefined or null

  // Extract the file name after the last slash
  const fileName = remoteUrl.split("/").pop();

  // Check if the file name contains underscores
  if (fileName.includes("_")) {
    // If it contains underscores, follow the original logic
    return fileName
      .split("_") // Split the string by underscore
      .slice(1) // Exclude the first part before the first underscore
      .join("_"); // Join the remaining parts with underscore
  } else {
    // If there are no underscores, return the file name without extension
    return fileName.split(".").slice(0, -1).join("."); // Remove the file extension
  }
};

const DocumentCard = () => {
  const router = useRouter();
  const { organizationId, documentId } = router.query;
  const projectId = useSelector((state) => state.activeProject.activeProject.id);  
  const document = useSelector((state) => state.activeDocument.activeDocument);  
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const [documentSections, setDocumentSections] = useState([]);
  const [showCreateButton, setShowCreateButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const store = useSelector(state => state)
  console.log("STATE-sections", store)

  useEffect(() => {
    fetchDocumentSections();
  }, [documentId]);

  const fetchDocumentSections = async () => {
    setIsLoading(true);

    try {
      const response = await documentService.getSectionsByDocumentId(
        organizationId,
        projectId,
        documentId,
        storedToken
      );
      setDocumentSections(response.data || []);
      setIsLoading(false);
      if (response.data === null || response.data.length === 0) {
        setShowCreateButton(true); // Show the button if data is null or empty
      } else {
        setDocumentSections(response.data);
        setShowCreateButton(false); // Hide the button if data is fetched successfully
      }
    } catch (err) {
      console.error("Failed to fetch document sections:", err);
      setError("Failed to load sections");
      if (
        authConfig.onTokenExpiration === "logout" &&
        !router.pathname.includes("login")
      ) {
        router.replace("/login");
      }
    }
  };

  const createSections = async () => {
    try {
      await documentService.triggerJobs(organizationId, projectId, storedToken);
      router.push(
        `/gendox/home?organizationId=${organizationId}&projectId=${projectId}`
      );
    } catch (err) {
      console.error("Error creating sections:", err);
    }
  };

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Card sx={{ position: "relative" }}>
      <CardHeader
        title={
          <span>
            Document: <strong>{formatDocumentTitle(document.remoteUrl)}</strong>
          </span>
        }
      />

      <CardContent>
        {documentSections.map((section, index) => (
          <Grid container xs={12} sm={6} sx={{ mb: 15 }} key={section.id || index}>
            <SectionCard section={section} />
          </Grid>
        ))}

        {showCreateButton && (
          <Button variant="contained" onClick={createSections}>
            Create Sections
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentCard;
