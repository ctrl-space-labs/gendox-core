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

const ChatLogInfo = ({ messageMetadata }) => {
  const router = useRouter();
  const { organizationId } = router.query;

  console.log("messageMetadata", messageMetadata);

  // Handle if messageMetadata is not an array or is empty
  if (!Array.isArray(messageMetadata) || messageMetadata.length === 0) {
    return (
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
          No additional information available.
        </Typography>
      </Box>
    );
  }


  // Check if at least one sectionData has "ORIGINAL_DOCUMENT"
  const hasOriginalDocument = messageMetadata.some((sectionData) =>
    sectionData.policyValue.includes("ORIGINAL_DOCUMENT")
  );

  // Check if at least one sectionData has "OWNER_PROFILE"
  const hasOwnerProfile = messageMetadata.some((sectionData) =>
    sectionData.policyValue.includes("OWNER_PROFILE")
  );

  // Create a Set to track unique combinations of `userName` and `documentName`
  const seenUniqueEntries = new Set();
  const filteredMessageMetadata = messageMetadata.filter((sectionData) => {
    const documentName = formatDocumentTitle(sectionData.documentUrl)
    // sectionData.policyValue.includes("ORIGINAL_DOCUMENT")
    //   ? formatDocumentTitle(sectionData.documentUrl)
    //   : "Secret Document";
    const uniqueKey = `${sectionData.userName}-${documentName}`;

    // Include if it's an "ORIGINAL_DOCUMENT" or not yet seen
    if (
      // sectionData.policyValue.includes("ORIGINAL_DOCUMENT") ||
      !seenUniqueEntries.has(uniqueKey)
    ) {
      seenUniqueEntries.add(uniqueKey);
      return true;
    }

    // Exclude duplicates
    return false;
  });

  // Handle case when there's no original document or owner profile
  // if (!hasOriginalDocument && !hasOwnerProfile) {
  //   return (
  //     <Box
  //       sx={{
  //         display: "flex",
  //         justifyContent: "center",
  //         alignItems: "center",
  //         p: 2,
  //         borderRadius: 1,
  //         boxShadow: 1,
  //         backgroundColor: "action.hover",
  //         mt: 3,
  //       }}
  //     >
  //       <Typography variant="body2" sx={{ color: "text.secondary" }}>
  //         No original documents or owner profiles available.
  //       </Typography>
  //     </Box>
  //   );
  // }


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
          const documentUrl = `/gendox/document-instance?organizationId=${organizationId}&documentId=${sectionData.documentId}`;
          // const sectionUrl = `/gendox/document-instance?organizationId=${organizationId}&sectionId=${sectionData.sectionId}`;

          let gridSize;

          // Adjust grid sizes based on the total number of objects
          switch (messageMetadata.length) {
            case 1:
              gridSize = { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 };
              break;
            case 2:
              gridSize = { xs: 12, sm: 6, md: 6, lg: 6, xl: 6 };
              break;
            case 3:
              gridSize = { xs: 12, sm: 6, md: 4, lg: 4, xl: 4 };
              break;
            case 4:
              gridSize = { xs: 12, sm: 6, md: 3, lg: 3, xl: 3 };
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
                    {/* {hasOwnerProfile && (
                      <> */}
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
                      {/* </> */}
                    {/* )} */}
                  </Box>
                  {/* </ListItemButton> */}
                </ListItem>

                <ListItem disablePadding>
                  {/* {sectionData.policyValue.includes("ORIGINAL_DOCUMENT") ? ( */}
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
                  {/* ) : (
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
                  )} */}
                </ListItem>

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
