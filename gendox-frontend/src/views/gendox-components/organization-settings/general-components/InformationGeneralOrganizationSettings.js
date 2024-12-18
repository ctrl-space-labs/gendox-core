// ** React Imports
import React, { useState, useEffect } from "react";

// ** Next Import
import { useRouter } from "next/router";

// ** Redux Imports
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";

// ** Config
import authConfig from "src/configs/auth";

// ** MUI Imports
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Icon from "src/@core/components/icon";
import Typography from "@mui/material/Typography";

// ** Service Import
import organizationService from "src/gendox-sdk/organizationService";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";

const InformationGeneralOrganizationSettings = () => {
  const theme = useTheme();
  const router = useRouter();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const { activeOrganization: organization } = useSelector(
    (state) => state.activeOrganization
  );

  const provenAiUrl = process.env.NEXT_PUBLIC_PROVEN_AI_URL;

  const [name, setName] = useState(organization.name || "");
  const [displayName, setDisplayName] = useState(
    organization.displayName || ""
  );
  const [address, setAddress] = useState(organization.address || "");
  const [phone, setPhone] = useState(organization.phone || "");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    setName(organization.name || "");
    setDisplayName(organization.displayName || "");
    setAddress(organization.address || "");
    setPhone(organization.phone || "");
  }, [organization]);

  // Handlers for form inputs
  const handleNameChange = (event) => setName(event.target.value);
  const handleDisplayNameChange = (event) =>
    setDisplayName(event.target.value);
  const handleAddressChange = (event) => setAddress(event.target.value);
  const handlePhoneChange = (event) => setPhone(event.target.value);
  const handleCloseSnackbar = () => setOpenSnackbar(false);
  const handleAlertClose = () => setAlertOpen(false);

  // Handle Delete dialog
  const handleDeleteClickOpen = () => setOpenDeleteDialog(true);
  const handleDeleteClose = () => setOpenDeleteDialog(false);

  // Submit PUT request
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Construct the updated organization payload
    const updatedOrganizationPayload = {
      id: organization.id,
      name,
      displayName,
      address,
      phone,
    };

    try {
      const response = await organizationService.updateOrganization(
        organization.id,
        updatedOrganizationPayload,
        storedToken
      );
      console.log("Organization Update successful", response);
      setOpenSnackbar(true);
      const path = `/gendox/organization-settings/?organizationId=${response.data.id}`;
      router.reload(path);
    } catch (error) {
      console.error("Failed to update Organization", error);
    }
  };

  // Handler for deleting organization
  const handleDeleteOrganization = async () => {
    try {
      await organizationService.deactivateOrganizationById(
        organization.id,
        storedToken
      );
      console.log("Organization Deactivation successful");
      setAlertMessage("Organization deleted successfully!");
      setAlertOpen(true);
      handleDeleteClose(false);
  
      
      window.location.href  = "/gendox/home";
      
    } catch (error) {
      console.error("Failed to delete organization", error);
      setAlertMessage("Failed to delete the organization!");
      setAlertOpen(true);
  
      // Redirect to the home page in case of an error
      router.push("/gendox/home");
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
        }}
      >
      <CardHeader title="Information"/>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          Organization updated successfully!
        </Alert>
      </Snackbar>
      </Box>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Grid container spacing={5}>           
            
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-name"
                label="Name"
                value={name}
                onChange={handleNameChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-displayName"
                label="Display Name"
                value={displayName}
                onChange={handleDisplayNameChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-address"
                label="Address"
                value={address}
                onChange={handleAddressChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-phone"
                label="Phone"
                value={phone}
                onChange={handlePhoneChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}></Grid>
            <Grid
              item
              xs={12}
              sm={6}
              md={6}
              sx={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
              }}
            >
              <Button
                size="large"
                variant="outlined"
                href={`${provenAiUrl}/provenAI/home/?organizationId=${organization.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Box component="span" sx={{ mr: 5 }}>
                  Go to Proven-Ai
                </Box>
                <Icon icon="mdi:arrow-right-thin" />{" "}
              </Button>
            </Grid>
          </Grid>
        </CardContent>

        {/* <Divider sx={{ m: "0 !important" }} /> */}
        <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
          <Button
            size="large"
            variant="outlined"
            color="error"
            onClick={handleDeleteClickOpen}
            sx={{ px: 5, py: 1 }}
          >
            Delete
          </Button>

          <Button
            size="large"
            type="submit"
            variant="contained"
            sx={{ px: 5, py: 1 }}
          >
            Save Changes
          </Button>
        </CardActions>
      </form>

      <Snackbar
        open={alertOpen}
        autoHideDuration={6000}
        onClose={handleAlertClose}
      >
        <Alert
          onClose={handleAlertClose}
          severity="success"
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteOrganization}
        title="Delete"
        contentText={`Are you sure you want to delete ${organization.name}? All member users will be removed, and you will lose access to all related documents. This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </>
  );
};

export default InformationGeneralOrganizationSettings;
