// ** React Imports
import { useEffect, useState } from "react";

// ** Axios
import axios from "axios";

// ** MUI Imports
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";

// Components
import SectionCard from "src/views/gendox-components/document-sections-components/SectionCard";

// ** Config
import authConfig from "src/configs/auth";
import apiRequests from "src/configs/apiRequest";

// ** Redux
import { useSelector } from "react-redux";

// ** Next Import
import { useRouter } from "next/router";

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

const DocumentSectionsCard = () => {
  const router = useRouter();
  const { organizationId, projectId } = router.query;
  const document = useSelector((state) => state.activeDocument.activeDocument);

  const [documentSections, setDocumentSections] = useState([]);
  const [showCreateButton, setShowCreateButton] = useState(false);

  useEffect(() => {
    fetchDocumentSections();
  }, [organizationId, projectId, document.id]); // Adding dependencies to refetch when these values change

  const fetchDocumentSections = async () => {
    const storedToken = window.localStorage.getItem(
      authConfig.storageTokenKeyName
    );
    if (storedToken) {
      await axios
        .get(
          apiRequests.documentSections(organizationId, projectId, document.id),
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + storedToken,
            },
            params: {
              projectId: projectId,
            },
          }
        )
        .then((response) => {
          
          if (response.data === null || response.data.length === 0) {
            setShowCreateButton(true); // Show the button if data is null or empty
          } else {            
            setDocumentSections(response.data);
            setShowCreateButton(false); // Hide the button if data is fetched successfully
          }
        })
        .catch(() => {
          if (
            authConfig.onTokenExpiration === "logout" &&
            !router.pathname.includes("login")
          ) {
            router.replace("/login");
          }
        });
    }
  };

  const createSections = async () => {
    const storedToken = window.localStorage.getItem(
      authConfig.storageTokenKeyName
    );
    if (storedToken) {
      // Replace this URL with your API endpoint for creating sections
      await axios
      .get(
        apiRequests.triggerJobs(organizationId, projectId),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + storedToken,
          },
          params: {
            projectId: projectId,
          },
        }
      )
        .then(() => {          
          router.push(`/gendox/home?organizationId=${organizationId}&projectId=${projectId}`);
        })
        .catch((error) => {
          console.error("Error creating sections:", error);          
        });
    }
  };

  // useEffect(() => {
  //   const initDocuments = async () => {

  //       const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName)

  //       if (storedToken) {
  //         // auth.setLoading(true)
  //         await axios
  //           .get(apiRequests.documentSections(organizationId, projectId, document.id), {
  //             headers: {
  //               'Content-Type': 'application/json',
  //               Authorization: 'Bearer ' + storedToken
  //             },
  //                params: {
  //               projectId: projectId
  //             }
  //           })
  //           .then(async response => {
  //             setDocumentSections(response.data)
  //           })
  //           .catch(() => {
  //             if (authConfig.onTokenExpiration === 'logout' && !router.pathname.includes('login')) {
  //               router.replace('/login')
  //             }
  //           })
  //       }

  //   }
  //   initDocuments()
  // }, [])

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
        {documentSections.map((section) => (
          <Grid container xs={12} sm={6} sx={{ mb: 15 }}>
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

export default DocumentSectionsCard;
