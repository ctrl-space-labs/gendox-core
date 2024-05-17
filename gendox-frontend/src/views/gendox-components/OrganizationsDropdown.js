// General and MUI Imports
import React, { useState, useEffect, useCallback, Fragment } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Box from "@mui/material/Box";
import AvatarGroup from "@mui/material/AvatarGroup";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";

// ** Icon Imports
import Icon from "src/@core/components/icon";

// Utility and Hooks Imports
import { useAuth } from "src/hooks/useAuth";
import { fetchProject } from "src/store/apps/activeProject/activeProject";
import { fetchOrganization } from "src/store/apps/activeOrganization/activeOrganization";

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
      const { projects } = organization;
      const newProjectId = projects?.[0]?.id ?? null;
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
      router.push(
        `/gendox/home?organizationId=${organization.id}&projectId=${newProjectId}`
      );
    },
    [dispatch, handleDropdownClose, router]
  );

  const sortedOrganizations = [...auth.user.organizations].sort((a, b) => {
    return a.id === activeOrganizationId
      ? -1
      : b.id === activeOrganizationId
      ? 1
      : 0;
  });

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
        {auth.user.organizations.map((organization) => (
          <MenuItem
            key={organization.id}
            sx={{ p: 0 }}
            onClick={() => handleOrganizations(organization)}
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
        ))}
      </Menu>
    </Fragment>
  );
};

export default OrganizationsDropdown;
