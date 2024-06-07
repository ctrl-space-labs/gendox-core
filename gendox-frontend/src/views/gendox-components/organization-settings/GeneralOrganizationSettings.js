// ** React Imports
import { useState, useEffect } from "react";

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
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import organizationService from "src/gendox-sdk/organizationService";

const GeneralOrganizationSettings = () => {
  const router = useRouter();
  const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName);
    if (!storedToken) {
      console.error('No token found');      
      return;
    }
  const organization = useSelector((state) => state.activeOrganization.activeOrganization);

  const [name, setName] = useState(organization.name);
  const [displayName, setDisplayName] = useState(organization.displayName);
  const [address, setAddress] = useState(organization.address);
  const [phone, setPhone] = useState(organization.phone);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Handlers for form inputs
  const handleNameChange = (event) => setName(event.target.value);
  const handleDisplayNameChange = (event) => setDisplayName(event.target.value);
  const handleAddressChange = (event) => setAddress(event.target.value);
  const handlePhoneChange = (event) => setPhone(event.target.value);  
  const handleCloseSnackbar = () => setOpenSnackbar(false);

  // submit put request
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Construct the JSON project
    const updatedOrganizationPayload = {
      id: organization.id,      
      name,
      displayName,
      address,
      phone
    };

    

    try {
      const response = await organizationService.updateOrganization(
        organization.id,        
        updatedOrganizationPayload,
        storedToken
      );
      console.log("Organization Update successful", response);
      setOpenSnackbar(true);
      const path = `/gendox/organization-settings?organizationId=${response.data.id}`
      router.push(path);
    } catch (error) {
      console.error("Failed to update Organization", error);
    }
  };

  return (
    <Card>
      <CardHeader title="Organization s settings" />
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
          Project updated successfully!
        </Alert>
      </Snackbar>
      <Divider sx={{ m: "0 !important" }} />
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Grid>
            <Grid item xs={12} sm={6} sx={{ mb: 15 }}>
              <TextField                
                id="organization-name"
                label="Name"                
                defaultValue={organization.name}             
                onChange={handleNameChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ mb: 15 }}>
            <TextField                
                id="organization-displayName"
                label="displayName"
                defaultValue={organization.displayName}                
                onChange={handleDisplayNameChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ mb: 15 }}>
            <TextField                
                id="organization-address"
                label="address"
                defaultValue={organization.address}                
                onChange={handleAddressChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
            <TextField                
                id="organization-phone"
                label="phone"
                defaultValue={organization.phone}                
                onChange={handlePhoneChange}
              />
            </Grid>
          </Grid>
        </CardContent>
        <Divider sx={{ m: "0 !important" }} />
        <CardActions>
          <Button
            size="large"
            type="submit"
            sx={{ mr: 2 }}
            onClick={handleSubmit}
            variant="contained"
          >
            Submit
          </Button>
          <Button
            type="reset"
            size="large"
            color="secondary"
            variant="outlined"
          >
            Reset
          </Button>
        </CardActions>
      </form>
    </Card>
  );
};

export default GeneralOrganizationSettings;
