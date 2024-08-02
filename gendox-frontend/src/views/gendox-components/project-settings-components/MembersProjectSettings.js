// ** React Imports
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { useSettings } from "src/@core/hooks/useSettings";

// ** MUI Imports
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
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
import QuickSearchToolbar from "src/views/gendox-components/project-settings-components/members-components/QuickSearchToolbar";
import InviteDialog from "src/views/gendox-components/project-settings-components/members-components/InviteDialog";
import projectService from "src/gendox-sdk/projectService";

import authConfig from "src/configs/auth";
import { styled, useTheme } from "@mui/material/styles";

// ** Utils Import
import { getInitials } from "src/@core/utils/get-initials";
import { set } from "nprogress";

// ** renders client column
const renderClient = (params) => {
  const { row } = params;
  const theme = useTheme();

  const stateNum = Math.floor(Math.random() * 6);
  const states = [
    "success",
    "error",
    "warning",
    "info",
    "primary",
    "secondary",
  ];
  const color = states[stateNum];
  //   if (row.avatar.length) {
  //     return (
  //       <CustomAvatar
  //         src={`/images/avatars/${row.avatar}`}
  //         sx={{ mr: 3, width: "1.875rem", height: "1.875rem" }}
  //       />
  //     );
  //   } else {
  return (
    <CustomAvatar
      skin="light"
      color={color}
      sx={{ mr: 3, fontSize: ".8rem", width: "1.875rem", height: "1.875rem" }}
    >
      {getInitials(
        row.name ? row.name : row.userName ? row.userName : "Unknown Name"
      )}
    </CustomAvatar>
  );
  //   }
};

const statusObj = {
  GENDOX_USER: { title: "GENDOX_USER", color: "primary" },
  GENDOX_AGENT: { title: "GENDOX_AGENT", color: "success" },
  UNKNOWN: { title: "UNKNOWN", color: "error" },
  DISCORD_USER: { title: "DISCORD_USER", color: "warning" },
  GENDOX_SUPER_ADMIN: { title: "GENDOX_SUPER_ADMIN", color: "info" },
};

const escapeRegExp = (value) => {
  return value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

const MembersProjectSettings = () => {
  const router = useRouter();
  const { settings } = useSettings();
  const isDemo = settings.isDemo;
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const project = useSelector((state) => state.activeProject.projectDetails);
  const { id: projectId, organizationId } = project;
  const [data, setData] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 7,
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSnackbar, setShowSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);


  useEffect(() => {
    if (projectId) {
      fetchProjectMembers();
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
      setData(fetchedProjectMembers);
      setFilteredData(fetchedProjectMembers);
    } catch (error) {
      console.error("Failed to fetch project members:", error);
    }
  };

  const handleSearch = (searchValue) => {
    setSearchText(searchValue);
    const searchRegex = new RegExp(escapeRegExp(searchValue), "i");

    const filteredRows = data.filter((row) => {
      return Object.keys(row).some((field) => {
        const fieldValue = row[field];
      return fieldValue && searchRegex.test(fieldValue.toString());
      });
    });
    setFilteredData(searchValue.length ? filteredRows : data);
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
        await projectService.deleteProjectMember(
          organizationId,
          projectId,
          selectedUser.id,
          storedToken
        );
        setData((prevData) =>
          prevData.filter((user) => user.id !== selectedUser.id)
        );
        setFilteredData((prevData) =>
          prevData.filter((user) => user.id !== selectedUser.id)
        );
        setShowSnackbar({
          open: true,
          message: "User deleted successfully",
          severity: "success",
        });
      } catch (error) {
        console.error("Failed to delete user:", error);
        setShowSnackbar({
          open: true,
          message: "Failed to delete user",
          severity: "error",
        });
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
            {renderClient(params)}
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
      headerName: "EMAIL",
      field: "email",
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: "text.primary" }}>
          {params.row.email}
        </Typography>
      ),
    },

    {
      flex: 0.2,
      minWidth: 140,
      field: "userType",
      headerName: "User Type",
      renderCell: (params) => {
        const status = statusObj[params.row.userType];
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
            <MenuItem onClick={handleDeleteConfirmOpen}>Delete User</MenuItem>
            <MenuItem onClick={handleBanUser}>Ban User</MenuItem>
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
        pageSizeOptions={[7, 10, 25, 50]}
        paginationModel={paginationModel}
        slots={{ toolbar: QuickSearchToolbar }}
        onPaginationModelChange={setPaginationModel}
        rows={filteredData.length ? filteredData : data}
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
      <Dialog
        open={confirmDelete}
        onClose={handleDeleteConfirmClose}
        aria-labelledby="confirm-delete-dialog-title"
      >
        <DialogTitle id="confirm-delete-dialog-title" color="primary">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} color="primary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for notifications */}
      <Snackbar
        open={showSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar({ ...showSnackbar, open: false })}
      >
        <Alert
          onClose={() => setShowSnackbar({ ...showSnackbar, open: false })}
          severity={showSnackbar.severity}
        >
          {showSnackbar.message}
        </Alert>
      </Snackbar>

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
      />
    </Card>
  );
};

export default MembersProjectSettings;
