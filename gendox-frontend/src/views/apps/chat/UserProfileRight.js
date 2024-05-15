// ** React Imports
import { Fragment } from "react";
import { useState, useEffect } from "react";

import { useRouter } from "next/router";
import { parseISO, format } from "date-fns";

// ** MUI Imports
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import Badge from "@mui/material/Badge";
import MuiAvatar from "@mui/material/Avatar";
import ListItem from "@mui/material/ListItem";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Button from "@mui/material/Button";

// ** Icon Imports
import Icon from "src/@core/components/icon";

// ** Third Party Components
import PerfectScrollbar from "react-perfect-scrollbar";

// ** Custom Component Imports
import Sidebar from "src/@core/components/sidebar";
import CustomAvatar from "src/@core/components/mui/avatar";
import authConfig from "src/configs/auth";
import projectService from "src/gendox-sdk/projectService";

const UserProfileRight = (props) => {
  const {
    store,
    hidden,
    statusObj,
    getInitials,
    sidebarWidth,
    userProfileRightOpen,
    handleUserProfileRightSidebarToggle,
  } = props;

  const router = useRouter();
  const { organizationId } = router.query;
  const projectId = store.selectedChat.contact.projectId;
  const [projectAgent, setProjectAgent] = useState(null);
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  if (!storedToken) {
    console.error("No token found");
    return;
  }

  useEffect(() => {
    const fetchAiModels = async () => {
      try {
        const projectResponse = await projectService.getProjectById(
          organizationId,
          projectId,
          storedToken
        );
        console.log("aaa", projectResponse.data.projectAgent);
        setProjectAgent(projectResponse.data.projectAgent);
      } catch (error) {
        console.error("Failed to fetch project", error);
      }
    };

    fetchAiModels();
  }, [organizationId, projectId, storedToken]);

  const handleEditAgent = () => {
    router.push(
      `/gendox/project-settings?organizationId=${organizationId}&projectId=${projectId}`
    );
  };

  const ScrollWrapper = ({ children }) => {
    if (hidden) {
      return (
        <Box sx={{ height: "100%", overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </Box>
      );
    } else {
      return (
        <PerfectScrollbar options={{ wheelPropagation: false }}>
          {children}
        </PerfectScrollbar>
      );
    }
  };

  return (
    <Sidebar
      direction="right"
      show={userProfileRightOpen}
      backDropClick={handleUserProfileRightSidebarToggle}
      sx={{
        zIndex: 9,
        height: "100%",
        width: sidebarWidth,
        borderTopRightRadius: (theme) => theme.shape.borderRadius,
        borderBottomRightRadius: (theme) => theme.shape.borderRadius,
        "& + .MuiBackdrop-root": {
          zIndex: 8,
          borderRadius: 1,
        },
      }}
    >
      {store && store.selectedChat && projectAgent ? (
        <Fragment>
          <Box sx={{ position: "relative" }}>
            <IconButton
              size="small"
              onClick={handleUserProfileRightSidebarToggle}
              sx={{
                top: "0.7rem",
                right: "0.7rem",
                position: "absolute",
                color: "text.secondary",
                "& svg": { color: "action.active" },
              }}
            >
              <Icon icon="mdi:close" />
            </IconButton>
            <Box
              sx={{
                px: 5,
                pb: 7,
                pt: 9.5,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  badgeContent={
                    <Box
                      component="span"
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        color: `${
                          statusObj[store.selectedChat.contact.status]
                        }.main`,
                        boxShadow: (theme) =>
                          `0 0 0 2px ${theme.palette.background.paper}`,
                        backgroundColor: `${
                          statusObj[store.selectedChat.contact.status]
                        }.main`,
                      }}
                    />
                  }
                >
                  {store.selectedChat.contact.avatar ? (
                    <MuiAvatar
                      sx={{ width: "5rem", height: "5rem" }}
                      src={store.selectedChat.contact.avatar}
                      alt={store.selectedChat.contact.fullName}
                    />
                  ) : (
                    <CustomAvatar
                      skin="light"
                      color={store.selectedChat.contact.avatarColor}
                      sx={{
                        width: "5rem",
                        height: "5rem",
                        fontWeight: 500,
                        fontSize: "2rem",
                      }}
                    >
                      {getInitials(store.selectedChat.contact.fullName)}
                    </CustomAvatar>
                  )}
                </Badge>
              </Box>
              <Typography
                sx={{ mb: 0.75, fontWeight: 600, textAlign: "center" }}
              >
                {store.selectedChat.contact.fullName}
              </Typography>
              <Typography variant="body2" sx={{ textAlign: "center" }}>
                {store.selectedChat.contact.role}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ height: "calc(100% - 13.0625rem)" }}>
            <ScrollWrapper>
              <Box sx={{ px: 5, py: 4 }}>
                <FormGroup sx={{ mb: 6 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    About
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                    {store.selectedChat.contact.about}
                  </Typography>
                </FormGroup>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Project Agent Details
                </Typography>

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Icon icon="mdi:brain" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Completion Model"
                      secondary={projectAgent.completionModel.name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Icon icon="mdi:magnify" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Semantic Search Model"
                      secondary={projectAgent.semanticSearchModel.name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Icon icon="mdi:file-document-outline" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Document Splitter"
                      secondary={projectAgent.documentSplitterType.name}
                    />
                  </ListItem>
                  {/* <ListItem>
                    <ListItemIcon>
                      <Icon icon="mdi:shield-check-outline" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Moderation Model"
                      secondary={projectAgent.moderationModel.name}
                    />
                  </ListItem> */}

                  <ListItem>
                    <ListItemIcon>
                      <Icon icon="mdi:thermometer-lines" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Max Tokens"
                      secondary={projectAgent.maxToken}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Icon icon="mdi:coolant-temperature" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Temperature"
                      secondary={projectAgent.temperature}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Icon icon="mdi:format-list-numbered" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Top P"
                      secondary={projectAgent.topP}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Icon icon="mdi:calendar-clock" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Created At"
                      secondary={
                        projectAgent.createdAt
                          ? format(parseISO(projectAgent.createdAt), "PPP")
                          : "N/A"
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Icon icon="mdi:gesture-tap-button" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Agent Behavior"
                      secondary={projectAgent.agentBehavior}
                    />
                  </ListItem>
                </List>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleEditAgent}
                  fullWidth
                >
                  Edit Agent
                </Button>
              </Box>
            </ScrollWrapper>
          </Box>
        </Fragment>
      ) : null}
    </Sidebar>
  );
};

export default UserProfileRight;
