// ** React Imports
import { useState, Fragment, useEffect, useCallback } from "react";

// Redux Imports
import { useDispatch, useSelector } from "react-redux";

// ** Next Import
import { useRouter } from "next/router";

// MUI Imports
import { Box, Menu, Badge, MenuItem, AvatarGroup, styled } from "@mui/material";

// Custom Component & Hook Imports
import { useAuth } from "src/hooks/useAuth";
import CustomAvatar from "src/@core/components/mui/avatar";
import authConfig from "src/configs/auth";
import { fetchProjectById } from "src/store/apps/activeProject/activeProject";
import { fetchOrganizationById } from "src/store/apps/activeOrganization/activeOrganization";

const menuItemStyles = {
  py: 2,
  px: 4,
  width: "100%",
  display: "flex",
  alignItems: "center",
  color: "text.primary",
  textDecoration: "none",
  "& svg": {
    mr: 2,
    fontSize: "1.375rem",
    color: "text.primary",
  },
};

const OrganizationsDropdown = ({ settings }) => {
  const { direction } = settings;
  const dispatch = useDispatch();
  const router = useRouter();
  const { organizationId } = router.query;
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const activeOrganization = useSelector(
    (state) => state.activeOrganization.activeOrganization
  );

  const { logout } = useAuth();
  const userData = useAuth();
  const { organizations } = userData.user;

  useEffect(() => {
    if (organizationId && storedToken) {
      dispatch(fetchOrganizationById({ organizationId, storedToken }));
    }
  }, [dispatch, organizationId, storedToken]);

  // ** States
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDropdownOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDropdownClose = useCallback(
    (url) => {
      if (url) router.push(url);
      setAnchorEl(null);
    },
    [router]
  );

  const handleOrganizations = useCallback(
    (organization) => {
      dispatch(
        fetchOrganizationById({
          organizationId: organization.id,
          storedToken,
        })
      );

      handleDropdownClose();
      localStorage.setItem(authConfig.selectedOrganizationId, organization.id);
      const newProjectId = organization.projects?.[0]?.id ?? null;
      dispatch(
        fetchProjectById({
          organizationId: organization.id,
          projectId: newProjectId,
          storedToken,
        })
      );
      localStorage.setItem(authConfig.selectedProjectId, newProjectId);
      router.push(
        `/gendox/home?organizationId=${organization.id}&projectId=${newProjectId}`
      );
    },
    [dispatch, handleDropdownClose, router]
  );

  return (
    <Fragment>
      <Badge
        overlap="circular"
        sx={{ ml: 2, cursor: "pointer" }}
        onClick={handleDropdownOpen}
      >
        <AvatarGroup max={2}>
          {organizations.map((organization) => (
            <CustomAvatar
              key={organization.id}
              onClick={() => {
                handleOrganizations(organization);
              }}
              sx={{
                width: 40,
                height: 40,

                // backgroundColor: 'blue',
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                borderRadius: "50%",
                fontSize: "16px",
              }}
            >
              {organization.name.substring(0, 4)}
            </CustomAvatar>
          ))}
        </AvatarGroup>
      </Badge>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleDropdownClose()}
        sx={{ "& .MuiMenu-paper": { width: 230, mt: 4 } }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: direction === "ltr" ? "right" : "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: direction === "ltr" ? "right" : "left",
        }}
      >
        {organizations.map((organization) => (
          <MenuItem
            key={organization.id}
            sx={{ p: 0 }}
            onClick={() => handleOrganizations(organization)}
          >
            <Box sx={menuItemStyles}>
              {/* <AddHomeIcon /> */}
              {organization.name}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Fragment>
  );
};

export default OrganizationsDropdown;
