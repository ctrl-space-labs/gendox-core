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

  if (!messageMetadata || messageMetadata.length === 0) {
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
        {messageMetadata.map((sectionData, idx) => {
          const documentName = formatDocumentTitle(sectionData.documentUrl);
          const documentUrl = `/gendox/document-instance?organizationId=${organizationId}&documentId=${sectionData.documentId}`;
          const sectionUrl = `/gendox/document-instance?organizationId=${organizationId}&sectionId=${sectionData.sectionId}`;

          return (
            <Grid item xs={12} md={6} key={idx}>
              <List
                component="nav"
                aria-label="main mailbox"
                sx={{
                  p: 3,
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
                    <ListItemIcon sx={{ color: "primary.main" }}>
                      <Icon icon="mdi:account" fontSize={20} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        sectionData.policyValue.includes("OWNER_PROFILE")
                          ? sectionData.userName
                          : "Secret Owner"
                      }
                    />
                    </Box>
                  {/* </ListItemButton> */}
                </ListItem>

                <Tooltip title="View document">
                  <ListItem disablePadding>
                    <ListItemButton
                      component="a"
                      href={documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ListItemIcon sx={{ color: "primary.main" }}>
                        <Icon icon="mdi:file-document-outline" fontSize={20} />
                      </ListItemIcon>
                      <ListItemText primary={documentName} />
                    </ListItemButton>
                  </ListItem>
                </Tooltip>

                <Tooltip title="View section">
                  <ListItem disablePadding>
                    <ListItemButton
                      component="a"
                      href={sectionUrl}
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
                </Tooltip>
              </List>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ChatLogInfo;
