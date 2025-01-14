import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { useSettings } from "src/@core/hooks/useSettings";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import CardHeader from "@mui/material/CardHeader";
import { DataGrid } from "@mui/x-data-grid";
import Icon from "src/@core/components/icon";
import authConfig from "src/configs/auth";
import CustomChip from "src/@core/components/mui/chip";
import QuickSearchToolbar from "src/utils/searchToolbar";
import SendInvitation from "src/views/gendox-components/organization-settings/members-components/SendInvitation";
import organizationService from "src/gendox-sdk/organizationService";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";
import { getErrorMessage } from "src/utils/errorHandler";
import toast from "react-hot-toast";

import {
  userTypeStatus,
  memberRoleStatus,
  escapeRegExp,
  renderClientAvatar,
} from "src/utils/membersUtils";

const MembersOrganizationSettings = () => {
  const router = useRouter();
  const { settings } = useSettings();
  const isDemo = settings.isDemo;
  const organization = useSelector(
    (state) => state.activeOrganization.activeOrganization
  );
  const { id: organizationId } = organization;
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [searchText, setSearchText] = useState([]);
  const [filteredOrganizationMembers, setFilteredOrganizationMembers] =
    useState([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 7,
  });

  const [roleAnchorEl, setRoleAnchorEl] = useState(null);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isBlurring, setIsBlurring] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);


  useEffect(() => {    
    if (organizationId) {
      fetchOrganizationMembers();
    }
  }, [organizationId]);

  const fetchOrganizationMembers = async () => {
    setIsBlurring(true);
    try {
      const response = await organizationService.getUsersInOrganizationByOrgId(
        organizationId,
        storedToken
      );
      const fetchedOrganizationMembers = response.data;
      setOrganizationMembers(fetchedOrganizationMembers);
      setFilteredOrganizationMembers(fetchedOrganizationMembers);
      setIsBlurring(false);
    } catch (error) {
      toast.error(`Failed to fetch organization members. Error: ${getErrorMessage(error)}`);
      console.error("Failed to fetch organization members:", error);
      setIsBlurring(false);
    }
  };

  const handleSearch = (searchValue) => {
    setSearchText(searchValue);
    const searchRegex = new RegExp(escapeRegExp(searchValue), "i");

    const filteredRows = organizationMembers.filter((row) => {
      return (
        searchRegex.test(row.user.name || "") ||
        searchRegex.test(row.user.userName || "") ||
        searchRegex.test(row.user.email || "") ||
        (row.user.phone && searchRegex.test(row.user.phone)) ||
        searchRegex.test(row.role?.name || "") || // Filter by role
        searchRegex.test(row.user.userType.name || "") // Filter by user type
      );
    });
    setFilteredOrganizationMembers(
      searchValue.length ? filteredRows : organizationMembers
    );
  };

  const handleRoleMenuClick = (event, row) => {
    setRoleAnchorEl(event.currentTarget);
    setSelectedUserForRole(row);
  };

  const handleActionMenuClick = (event, row) => {
    setActionAnchorEl(event.currentTarget);
    setSelectedUserForAction(row);
  };

  const handleMenuClose = () => {
    setRoleAnchorEl(null);
    setActionAnchorEl(null);
  };

  const handleBanUser = () => {
    // Implement the ban user logic here
    console.log("Banning user:", selectedUserForAction);
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

  const toggleInviteDialog = () => {
    setShowInviteDialog((prev) => !prev);
  };

  const handleChangeUserRole = async (newRole) => {
    if (selectedUserForRole) {
      try {
        // Update role in
        const data = {
          userOrganizationId: selectedUserForRole.id,
          roleName: newRole,
        };

        await organizationService.updateMembersRole(
          organizationId,
          selectedUserForRole.user.id,
          data,
          storedToken
        );

        // Update state
        const updatedMembers = organizationMembers.map((user) =>
          user.id === selectedUserForRole.id
            ? { ...user, role: { name: newRole } }
            : user
        );
        setOrganizationMembers(updatedMembers);
        setFilteredOrganizationMembers(updatedMembers);
        toast.success(`Role updated successfully`);
      } catch (error) {
        console.error("Failed to update user role:", error);
        toast.error(`Role update failed. Error: ${getErrorMessage(error)}`);
      }
      handleMenuClose();
    }
  };

  const handleDeleteUser = async () => {
    if (selectedUserForAction) {
      try {
        await organizationService.removeOrganizationMember(
          organizationId,
          selectedUserForAction.user.id,
          storedToken
        );
        setOrganizationMembers((prevData) =>
          prevData.filter((user) => user.id !== selectedUserForAction.id)
        );
        setFilteredOrganizationMembers((prevData) =>
          prevData.filter((user) => user.id !== selectedUserForAction.id)
        );
        toast.success("User deleted successfully");
      } catch (error) {
        toast.error(`User deletion failed. Error: ${getErrorMessage(error)}`);
        console.error("Failed to delete user:", error);
      }
      setConfirmDelete(false);
      handleMenuClose();
    }
  };

  const columns = [
    {
      flex: 0.275,
      minWidth: 290,
      field: "name",
      headerName: "Name",
      renderCell: (params) => {
        const { user } = params.row;

        return (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {renderClientAvatar(user)}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                noWrap
                variant="body2"
                sx={{ color: "text.primary", fontWeight: 600 }}
              >
                {user.name}
              </Typography>
              <Typography noWrap variant="caption">
                {user.userName}
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
          {params.row.user.email}
        </Typography>
      ),
    },
    {
      flex: 0.2,
      minWidth: 120,
      field: "role",
      headerName: "Organization Role",
      renderCell: (params) => {
        const role = params.row.role?.name || "UNKNOWN";
        const status = memberRoleStatus[role] || memberRoleStatus.UNKNOWN;
        return (
          <Box sx={{ display: "flex", alignItems: "center" }}>
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

            {status?.title !== "ADMIN" && (
              <>
                <IconButton
                  onClick={(event) => handleRoleMenuClick(event, params.row)}
                >
                  <Icon icon="mdi:menu-swap-outline" />
                </IconButton>
                <Menu
                  id="role-menu"
                  anchorEl={roleAnchorEl}
                  open={
                    Boolean(roleAnchorEl) &&
                    selectedUserForRole?.id === params.row.id
                  }
                  onClose={handleMenuClose}
                  anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                  transformOrigin={{ vertical: "top", horizontal: "center" }}
                >
                  {Object.keys(memberRoleStatus)
                    .filter(
                      (roleKey) => roleKey !== role && roleKey !== "UNKNOWN"
                    )
                    .map((roleKey) => (
                      <MenuItem
                        key={roleKey}
                        onClick={() => handleChangeUserRole(roleKey)}
                      >
                        <Icon
                          icon={memberRoleStatus[roleKey].icon}
                          style={{
                            marginRight: "0.5rem",
                            color: memberRoleStatus[roleKey].color,
                          }}
                        />
                        {memberRoleStatus[roleKey].title}
                      </MenuItem>
                    ))}
                </Menu>
              </>
            )}
          </Box>
        );
      },
    },

    {
      flex: 0.2,
      minWidth: 140,
      field: "userType",
      headerName: "User Type",
      renderCell: (params) => {
        const userType = params.row.user.userType.name;
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
          {params.row.user.phone}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 80,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={(event) => handleActionMenuClick(event, params.row)}
          >
            <Icon icon="mdi:dots-vertical" />
          </IconButton>
          <Menu
            id="actions-menu"
            anchorEl={actionAnchorEl}
            open={
              Boolean(actionAnchorEl) &&
              selectedUserForAction?.id === params.row.id
            }
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
          filteredOrganizationMembers.length
            ? filteredOrganizationMembers
            : organizationMembers
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
        sx={{
          filter: isBlurring ? "blur(6px)" : "none",
          transition: "filter 0.3s ease",
        }}
      />

      <DeleteConfirmDialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        onConfirm={handleDeleteUser}
        title="Confirm Deletion User"
        contentText={`Are you sure you want to delete ${
          selectedUserForAction?.name ||
          selectedUserForAction?.userName ||
          "this user"
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
          
        >
          Invite new members
        </Button>
      </Box>
      {/* Send Invitation Drawer */}
      <SendInvitation open={showInviteDialog} toggle={toggleInviteDialog} />
    </Card>
  );
};

export default MembersOrganizationSettings;
