// General and MUI Imports
import React, { useState, useEffect, useCallback, Fragment, use } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import Box from "@mui/material/Box";
import AvatarGroup from "@mui/material/AvatarGroup";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";

// ** Icon Imports
import Icon from "src/@core/components/icon";

// Utility and Hooks Imports
import { useAuth } from "src/hooks/useAuth";
import { fetchProject } from "src/store/apps/activeProject/activeProject";
import { fetchOrganization } from "src/store/apps/activeOrganization/activeOrganization";
import { sortByField } from "src/utils/orderUtils";

// Custom Components Imports
import CustomAvatar from "src/@core/components/mui/avatar";

// Style and Config Imports
import authConfig from "src/configs/auth";

const OrganizationsDropdown = ({ settings }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeOrganizationId, setActiveOrganizationId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  useEffect(() => {
    const { organizationId } = router.query;
    if (organizationId) {
      setActiveOrganizationId(organizationId);
    }
  }, [router.query]);

  const handleDropdownOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = useCallback(() => setAnchorEl(null), []);

  const handleOrganizations = useCallback(
    (organization) => {
      const { projects, projectAgents } = organization;
      const newProjectId = projects?.[0]?.id ?? null;
      const newProjectAgent =
        projectAgents.find((agent) => agent.projectId === newProjectId) ?? null;
      handleDropdownClose();

      dispatch(
        fetchOrganization({
          organizationId: organization.id,
          storedToken,
        })
      );

      dispatch(
        fetchProject({
          organizationId: organization.id,
          projectId: newProjectId,
          storedToken,
        })
      );

      localStorage.setItem(authConfig.selectedOrganizationId, organization.id);
      localStorage.setItem(authConfig.selectedProjectId, newProjectId);
      setActiveOrganizationId(organization.id);

      let newPath = `/gendox/home/?organizationId=${organization.id}`;
      if (
        router.pathname === "/gendox/chat" &&
        newProjectId &&
        newProjectAgent
      ) {
        newPath = `/gendox/chat/?organizationId=${organization.id}&threadId=${newProjectAgent.userId}&projectId=${newProjectId}`;
      } else if (router.pathname === "/gendox/chat") {
        newPath = `/gendox/chat/?organizationId=${organization.id}`;
      } else if (
        router.pathname === "/gendox/organization-settings" &&
        newProjectId
      ) {
        newPath = `/gendox/organization-settings/?organizationId=${organization.id}&projectId=${newProjectId}`;
      } else if (
        router.pathname === "/gendox/organization-settings"
      ){
        newPath = `/gendox/organization-settings/?organizationId=${organization.id}`;
      }
      router.push(newPath);
    },
    [dispatch, handleDropdownClose, router]
  );

  const sortedOrganizations = sortByField(
    [...auth.user.organizations],
    "name",
    activeOrganizationId
  );

  const visibleOrganizations = sortedOrganizations.slice(0, visibleCount);
  const overflowCount = sortedOrganizations.length - visibleCount;

  return (
    <Fragment>
      <AvatarGroup
        max={visibleCount + 1}
        sx={{ ml: 2, cursor: "pointer" }}
        slotProps={{
          additionalAvatar: {
            onClick: handleDropdownOpen,
          },
        }}
      >
        {visibleOrganizations.map((organization, index) => (
          <Tooltip title={organization.name} key={organization.id}>
            <CustomAvatar
              sx={{
                width: 40,
                height: 40,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                borderRadius: "50%",
                fontSize: "16px",
                boxShadow:
                  organization.id === activeOrganizationId
                    ? "0 0 8px gold"
                    : "none",
                transition: "transform 0.3s ease",
                "&:hover": {
                  transform: "scale(1.2)",
                },
              }}
              onClick={() => handleOrganizations(organization)}
            >
              {organization.name.substring(0, 4)}
            </CustomAvatar>
          </Tooltip>
        ))}
        {overflowCount > 0 && (
          <Tooltip title="More" key="overflow-avatar">
            <CustomAvatar
              sx={{
                width: 40,
                height: 40,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "gray",
                color: "white",
                borderRadius: "50%",
                fontSize: "16px",
                border: "2px solid primary.dark",
              }}
              onClick={handleDropdownOpen}
            >
              +{overflowCount}
            </CustomAvatar>
          </Tooltip>
        )}
      </AvatarGroup>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleDropdownClose()}
        sx={{ "& .MuiMenu-paper": { width: 230, mt: 4 } }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: settings.direction === "ltr" ? "right" : "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: settings.direction === "ltr" ? "right" : "left",
        }}
      >
        {sortByField(
          [...auth.user.organizations],
          "name",
          activeOrganizationId
        ).map((organization) => {
          
          let href = `/gendox/home/?organizationId=${organization.id}`;

          // Determine the href based on the current route
          if (router.pathname === "/gendox/chat") {
            // Set href for chat if there's a projectId, add threadId if there's a newProjectAgent
            const newProjectId = organization.projects?.[0]?.id ?? "";
            const newProjectAgent = organization.projectAgents?.find(
              (agent) => agent.projectId === newProjectId
            );

            href = newProjectAgent
              ? `/gendox/chat/?organizationId=${organization.id}&threadId=${newProjectAgent.userId}&projectId=${newProjectId}`
              : `/gendox/chat/?organizationId=${organization.id}`;
          } else {
            // Use the first project's ID if available for other routes
            href = `/gendox/home/?organizationId=${organization.id}&projectId=${
              organization.projects?.[0]?.id ?? ""
            }`;
          }

          // const href =
          //   router.pathname === "/gendox/chat"
          //     ? `/gendox/chat/?organizationId=${organization.id}`
          //     : `/gendox/home/?organizationId=${organization.id}&projectId=${
          //         organization.projects?.[0]?.id ?? ""
          //       }`;

          return (
            <Link
              href={href}
              passHref
              key={organization.id}
              style={{ textDecoration: "none" }}
            >
              <MenuItem
                sx={{ p: 0 }}
                onClick={(e) => {
                  e.preventDefault();
                  handleOrganizations(organization);
                }}
                selected={organization.id === activeOrganizationId}
              >
                <Box
                  sx={{
                    py: 2,
                    px: 4,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    backgroundColor:
                      organization.id === activeOrganizationId
                        ? "primary.light"
                        : "inherit",
                    "& svg": {
                      mr: 2,
                      fontSize: "1.375rem",
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: "primary.main" }}>
                    <Icon icon="mdi:domain" fontSize={20} />
                  </ListItemIcon>
                  <ListItemText primary={organization.name} />
                </Box>
              </MenuItem>
            </Link>
          );
        })}
      </Menu>
    </Fragment>
  );
};

export default OrganizationsDropdown;
