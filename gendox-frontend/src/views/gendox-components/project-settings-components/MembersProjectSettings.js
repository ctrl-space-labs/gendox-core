// ** React Imports
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { useSettings } from "src/@core/hooks/useSettings";

// ** MUI Imports
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import CardHeader from "@mui/material/CardHeader";
import { DataGrid } from "@mui/x-data-grid";
import Icon from "src/@core/components/icon";

// ** Custom Components
import CustomChip from "src/@core/components/mui/chip";
import CustomAvatar from "src/@core/components/mui/avatar";
import QuickSearchToolbar from "src/utils/searchToolbar";
import InviteDialog from "src/views/gendox-components/project-settings-components/members-components/InviteDialog";
import projectService from "src/gendox-sdk/projectService";
import organizationService from "src/gendox-sdk/organizationService";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";
import { getErrorMessage } from "src/utils/errorHandler";

import authConfig from "src/configs/auth";
import toast from "react-hot-toast";

import {
  userTypeStatus,
  memberRoleStatus,
  escapeRegExp,
  renderClientAvatar,
} from "src/utils/membersUtils";

const MembersProjectSettings = () => {
  const router = useRouter();
  const { settings } = useSettings();
  const isDemo = settings.isDemo;
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const project = useSelector((state) => state.activeProject.projectDetails);
  const { id: projectId, organizationId } = project;
  const [projectMembers, setProjectMembers] = useState([]);
  const [searchText, setSearchText] = useState([]);
  const [filteredProjectMembers, setFilteredProjectMembers] = useState([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 7,
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organizationMembers, setOrganizationMembers] = useState([]);

  useEffect(() => {
    if (projectId) {
      fetchProjectMembers();
      fetchProjectMembersRole();
    }
  }, [projectId, organizationId, router]);

  const fetchProjectMembers = async () => {
    try {
      const response = await projectService.getProjectMembers(
        organizationId,
        projectId,
        storedToken
      );
      const fetchedProjectMembers = response.data.map((user) => ({
        ...user.user,
        userType: user.user.userType.name,
        activeProjectMember: true,
      }));
      setProjectMembers(fetchedProjectMembers);
      setFilteredProjectMembers(fetchedProjectMembers);
    } catch (error) {
      toast.error(`Failed to fetch project members. Error: ${getErrorMessage(error)}`);
      console.error("Failed to fetch project members:", error);
    }
  };

  const fetchProjectMembersRole = async () => {
    try {
      setLoading(true); // Start loading
      const response = await organizationService.getUsersInOrganizationByOrgId(
        organizationId,
        storedToken
      );
      setOrganizationMembers(response.data);
      const organizationUsers = response.data;
      // Update the existing project members with roles from organization users
      setProjectMembers((prevProjectMembers) => {
        const updatedProjectMembers = prevProjectMembers.map(
          (projectMember) => {
            const orgUser = organizationUsers.find(
              (orgUser) => orgUser.user.id === projectMember.id
            );
            return {
              ...projectMember,
              role: orgUser ? orgUser.role : null, // Assign role if found
            };
          }
        );

        // Update filteredProjectMembers as well
        setFilteredProjectMembers(updatedProjectMembers);

        return updatedProjectMembers;
      });
    } catch (error) {
      toast.error(`Failed to fetch project members role. Error: ${getErrorMessage(error)}`);
      console.error("Failed to fetch project members role:", error);
    } finally {
      setLoading(false); // Stop loading once fetch is done
    }
  };

  const handleSearch = (searchValue) => {
    setSearchText(searchValue);
    const searchRegex = new RegExp(escapeRegExp(searchValue), "i");

    const filteredRows = projectMembers.filter((row) => {
      return Object.keys(row).some((field) => {
        const fieldValue = row[field];
        return fieldValue && searchRegex.test(fieldValue.toString());
      });
    });
    setFilteredProjectMembers(
      searchValue.length ? filteredRows : projectMembers
    );
  };

  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteUser = async () => {
    if (selectedUser) {
      try {
        await projectService.removeProjectMember(
          organizationId,
          projectId,
          selectedUser.id,
          storedToken
        );
        setProjectMembers((prevData) =>
          prevData.filter((user) => user.id !== selectedUser.id)
        );
        setFilteredProjectMembers((prevData) =>
          prevData.filter((user) => user.id !== selectedUser.id)
        );
        toast.success("User deleted successfully");
      } catch (error) {
        toast.error(`Failed to delete user. Error: ${getErrorMessage(error)}`);
        console.error("Failed to delete user:", error);
      }
      setConfirmDelete(false);
      handleMenuClose();
    }
  };

  const handleBanUser = () => {
    // Implement the ban user logic here
    console.log("Banning user:", selectedUser);
    handleMenuClose();
  };

  const handleDeleteConfirmOpen = () => {
    handleMenuClose();
    setConfirmDelete(true);
  };

  const handleDeleteConfirmClose = () => {
    setConfirmDelete(false);
  };

  const handleInviteNewMembers = () => {
    setShowInviteDialog(true);
  };

  const columns = [
    {
      flex: 0.275,
      minWidth: 290,
      field: "name",
      headerName: "Name",
      renderCell: (params) => {
        const { row } = params;

        return (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {renderClientAvatar(params)}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                noWrap
                variant="body2"
                sx={{ color: "text.primary", fontWeight: 600 }}
              >
                {row.name}
              </Typography>
              <Typography noWrap variant="caption">
                {row.userName}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      flex: 0.2,
      minWidth: 120,
      headerName: "Email",
      field: "email",
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: "text.primary" }}>
          {params.row.email}
        </Typography>
      ),
    },
    {
      flex: 0.2,
      minWidth: 120,
      field: "role",
      headerName: "Organization Role",
      renderCell: (params) => {
        if (loading) {
          // Render a loader or placeholder
          return <Typography variant="body2">Loading...</Typography>;
        }
        const role = params.row.role?.name || "UNKNOWN";
        const status = memberRoleStatus[role] || memberRoleStatus.UNKNOWN;
        return (
          <Typography
            variant="body2"
            sx={{ display: "flex", alignItems: "center" }}
          >
            {status.icon && (
              <Icon
                icon={status.icon}
                style={{ color: status.color, marginRight: "0.5rem" }}
              />
            )}

            {status.title}
          </Typography>
        );
      },
    },

    {
      flex: 0.2,
      minWidth: 140,
      field: "userType",
      headerName: "User Type",
      renderCell: (params) => {
        const userType = params.row.userType;
        const status = userTypeStatus[userType] || userTypeStatus.UNKNOWN;
        return (
          <CustomChip
            size="small"
            skin="light"
            color={status.color}
            label={status.title}
            sx={{ "& .MuiChip-label": { textTransform: "capitalize" } }}
          />
        );
      },
    },

    {
      flex: 0.125,
      field: "phone",
      minWidth: 80,
      headerName: "Phone",
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: "text.primary" }}>
          {params.row.phone}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 80,
      renderCell: (params) => (
        <>
          <IconButton onClick={(event) => handleMenuClick(event, params.row)}>
            <Icon icon="mdi:dots-vertical" />
          </IconButton>
          <Menu
            id="actions-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
          >
            <MenuItem onClick={handleDeleteConfirmOpen}>Remove User</MenuItem>
            {/* <MenuItem onClick={handleBanUser}>Ban User</MenuItem> */}
          </Menu>
        </>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader />
      <DataGrid
        autoHeight
        columns={columns}
        disableRowSelectionOnClick
        pageSizeOptions={[7, 10, 25, 50]}
        paginationModel={paginationModel}
        slots={{ toolbar: QuickSearchToolbar }}
        onPaginationModelChange={setPaginationModel}
        rows={
          filteredProjectMembers.length
            ? filteredProjectMembers
            : projectMembers
        }
        slotProps={{
          baseButton: {
            variant: "outlined",
          },
          toolbar: {
            value: searchText,
            clearSearch: () => handleSearch(""),
            onChange: (event) => handleSearch(event.target.value),
          },
        }}
      />

      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDeleteUser}
        title="Confirm Deletion User"
        contentText={`Are you sure you want to delete ${
          selectedUser?.name || selectedUser?.userName || "this user"
        }? This action cannot be undone.`}
        confirmButtonText="Remove Member"
        cancelButtonText="Cancel"
      />

      {/* Invite New Members Button */}
      <Box sx={{ padding: 4, display: "flex", justifyContent: "flex-end" }}>
        <Button
          size="large"
          variant="contained"
          onClick={handleInviteNewMembers}
          target="_blank"
          rel="noopener noreferrer"
        >
          Invite new members
        </Button>
      </Box>

      {/* Invite Dialog */}
      <InviteDialog
        open={showInviteDialog}
        handleClose={() => setShowInviteDialog(false)}
        organizationMembers={organizationMembers}
      />
    </Card>
  );
};

export default MembersProjectSettings;
