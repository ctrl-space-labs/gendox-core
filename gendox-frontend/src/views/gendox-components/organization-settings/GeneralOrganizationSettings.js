// ** React Imports
import { useState, useEffect, use } from "react";

// ** Next Import
import { useRouter } from "next/router";

// ** Redux
import { useSelector, useDispatch } from "react-redux";

// ** Config
import authConfig from "src/configs/auth";

// ** MUI Imports
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Icon from "src/@core/components/icon";
import Tooltip from "@mui/material/Tooltip";

import organizationService from "src/gendox-sdk/organizationService";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";

const GeneralOrganizationSettings = () => {
  const router = useRouter();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const organization = useSelector(
    (state) => state.activeOrganization.activeOrganization
  );
  const provenAiUrl = process.env.NEXT_PUBLIC_PROVEN_AI_URL;

  
  const [name, setName] = useState(organization.name);
  const [displayName, setDisplayName] = useState(organization.displayName);
  const [address, setAddress] = useState(organization.address);
  const [phone, setPhone] = useState(organization.phone);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false); 

  useEffect(() => {
    setName(organization.name);
    setDisplayName(organization.displayName);
    setAddress(organization.address);
    setPhone(organization.phone);
  }, [organization]);

  // Handlers for form inputs
  const handleNameChange = (event) => setName(event.target.value);
  const handleDisplayNameChange = (event) => setDisplayName(event.target.value);
  const handleAddressChange = (event) => setAddress(event.target.value);
  const handlePhoneChange = (event) => setPhone(event.target.value);
  const handleCloseSnackbar = () => setOpenSnackbar(false);
  const handleAlertClose = () => setAlertOpen(false);

  // Handle Delete dialog
  const handleDeleteClickOpen = () => setOpenDeleteDialog(true);
  const handleDeleteClose = () => setOpenDeleteDialog(false);

  // submit put request
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Construct the JSON project
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
      router.push(path);
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
      setTimeout(() => {
        router.push("/gendox/home");
      }, 2000); 
    } catch (error) {
      console.error("Failed to delete organization", error);
      setAlertMessage("Failed to delete the organization!");
      setAlertOpen(true);
  
      // Delay the redirection to ensure alert is displayed
      setTimeout(() => {
        router.push("/gendox/home");
      }, 2000); // Adjust the delay as needed
    }
  };


  return (
    <Card>
      <CardHeader />
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
              />
            </Grid>

            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-displayName"
                label="displayName"
                value={displayName}
                onChange={handleDisplayNameChange}
              />
            </Grid>

            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-address"
                label="address"
                value={address}
                onChange={handleAddressChange}
              />
            </Grid>

            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-phone"
                label="phone"
                value={phone}
                onChange={handlePhoneChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}></Grid>

            <Grid
              item
              xs={12}
              sm={6}
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
        <Divider sx={{ m: "0 !important" }} />
        <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
          <Button
            size="large"
            variant="outlined"
            color="error"
            onClick={handleDeleteClickOpen}
            sx={{ px: 22, py: 3 }}
          >
            Delete
          </Button>
          
          <Button
            size="large"
            type="submit"
            onClick={handleSubmit}
            variant="contained"
            sx={{ px: 22, py: 3 }}
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
        contentText={`Are you sure you want to delete ${organization.name}? All member users will be removed and you will lose access to all related documents. This action cannot be undone.`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </Card>
  );
};

export default GeneralOrganizationSettings;
