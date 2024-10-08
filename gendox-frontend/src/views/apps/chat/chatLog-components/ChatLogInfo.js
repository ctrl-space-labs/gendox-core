import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Icon from "src/@core/components/icon";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Grid from "@mui/material/Grid";
import { ListItemButton } from "@mui/material";
import { useRouter } from "next/router";
import { formatDocumentTitle } from "src/utils/documentUtils";

const EmptyStateMessage = ({ message }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      p: 2,
      borderRadius: 1,
      boxShadow: 1,
      backgroundColor: "action.hover",
      mt: 3,
    }}
  >
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {message}
    </Typography>
  </Box>
);

const ChatLogInfo = ({ messageMetadata }) => {
  const router = useRouter();
  const { organizationId } = router.query;


  if (!Array.isArray(messageMetadata) || messageMetadata.length === 0) {
    return <EmptyStateMessage message="No additional information available." />;
  }

  const hasOriginalDocument = messageMetadata.some((sectionData) =>
    sectionData.policyValue.includes("ORIGINAL_DOCUMENT")
  );
  

  const hasOwnerProfile = messageMetadata.some((sectionData) =>
    sectionData.policyValue.includes("OWNER_PROFILE")
  );



  const seenUniqueEntries = new Set();
  const filteredMessageMetadata = messageMetadata.filter((sectionData) => {
    sectionData.policyValue.includes("ORIGINAL_DOCUMENT")
      ? formatDocumentTitle(sectionData.documentUrl)
      : "Secret Document";
    const uniqueKey = `${sectionData.userName}-${sectionData.documentId}`;
    if (!seenUniqueEntries.has(uniqueKey)) {
      seenUniqueEntries.add(uniqueKey);
      return true;
    }

    return false;
  });


  if (!hasOriginalDocument && !hasOwnerProfile) {
    return (
      <EmptyStateMessage message="No documents or owner profiles available." />
    );
  }

  return (
    <Box
      sx={{
        mt: 3,
        p: 2,
        borderRadius: 1,
        boxShadow: 1,
        backgroundColor: "action.hover",
      }}
    >
      <Grid container spacing={3}>
        {filteredMessageMetadata.map((sectionData, idx) => {
          const documentName = formatDocumentTitle(sectionData.documentUrl);
          const documentUrl = `/gendox/document-instance/?organizationId=${sectionData.organizationId}&documentId=${sectionData.documentId}`;
          // const sectionUrl = `/gendox/document-instance/?organizationId=${organizationId}&sectionId=${sectionData.sectionId}`;

          let gridSize;

          // Adjust grid sizes based on the total number of objects
          switch (messageMetadata.length) {
            case 1:
              gridSize = { xs: 12 };
              break;
            case 2:
              gridSize = { xs: 12, sm: 6 };
              break;
            case 3:
              gridSize = { xs: 12, sm: 6, md: 4 };
              break;
            case 4:
              gridSize = { xs: 12, sm: 6, md: 3 };
              break;
            default: // Case 5 or more objects
              gridSize = { xs: 12, sm: 6, md: 6, lg: 4, xl: 2.4 }; // 5 items per row on large screens
              break;
          }

          return (
            <Grid item {...gridSize} key={idx}>
              <List
                component="nav"
                aria-label="main mailbox"
                sx={{
                  // p: 3,
                  borderRadius: 1,
                  backgroundColor: "background.paper",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 3,
                  },
                }}
              >
                <ListItem disablePadding>
                  {/* <ListItemButton> */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      paddingY: "12px",
                      paddingX: "16px",
                    }}
                  >
                    {sectionData.policyValue.includes("OWNER_PROFILE") && (
                      <>
                        <ListItemIcon sx={{ color: "primary.main" }}>
                          <Icon icon="mdi:account" fontSize={20} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: "0.75rem" }}>
                              {sectionData.userName}{" "}
                            </Typography>
                          }
                        />
                      </>
                    )}
                    
                  </Box>
                  
                  {/* </ListItemButton> */}
                </ListItem>

                <ListItem disablePadding>
                  {sectionData.policyValue.includes("ORIGINAL_DOCUMENT") ? (
                    <Tooltip title="View document">
                      <ListItemButton
                        component="a"
                        href={documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ListItemIcon sx={{ color: "primary.main" }}>
                          <Icon
                            icon="mdi:file-document-outline"
                            fontSize={20}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: "0.75rem" }}>
                              {documentName}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title=" This document is secret.">
                      <ListItem>
                        <ListItemIcon sx={{ color: "primary.main" }}>
                          <Icon
                            icon="mdi:file-document-outline"
                            fontSize={20}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography sx={{ fontSize: "0.75rem" }}>
                              Secret Document
                            </Typography>
                          }
                        />
                      </ListItem>
                    </Tooltip>
                  )}
                </ListItem>

                {/* Sections */}
                {/* <Tooltip title="View section">
                  <ListItem disablePadding>
                    <ListItemButton
                      component="a"
                      href={documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ListItemIcon sx={{ color: "primary.main" }}>
                        <Icon icon="mdi:file-tree-outline" fontSize={20} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          sectionData.policyValue.includes("ORIGINAL_DOCUMENT")
                            ? sectionData.sectionTitle
                            : "Secret"
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                </Tooltip> */}
              </List>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ChatLogInfo;
