// ** React Imports
import { useState, useEffect, use } from "react";

// ** Next Import
import { useRouter } from "next/router";

// ** Redux
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@mui/material/styles";

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
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

import organizationService from "src/gendox-sdk/organizationService";
import aiModelService from "src/gendox-sdk/aiModelService";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";
import { fetchOrganizationAiModelKeys } from "src/store/apps/activeOrganization/activeOrganization";

const GeneralOrganizationSettings = () => {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const organization = useSelector(
    (state) => state.activeOrganization.activeOrganization
  );
  const aiModelProviders = useSelector(
    (state) => state.activeOrganization.aiModelProviders
  );
  const aiModelKeys = useSelector(
    (state) => state.activeOrganization.aiModelKeys
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
  const [providerKeys, setProviderKeys] = useState({});

  console.log("Provider Keys", providerKeys);

  useEffect(() => {
    setName(organization.name);
    setDisplayName(organization.displayName);
    setAddress(organization.address);
    setPhone(organization.phone);

    const initialKeys = {};
    aiModelKeys.forEach((key) => {
      initialKeys[key.aiModelProvider.id] = key.key;
    });
    setProviderKeys(initialKeys);
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

  const handleProviderKeyChange = (providerId) => (event) => {
    setProviderKeys((prevKeys) => ({
      ...prevKeys,
      [providerId]: event.target.value,
    }));
  };

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

    // create new ai model provider keys
    try {
      for (const provider of aiModelProviders) {
        const existingKey = aiModelKeys.find(
          (key) => key.aiModelProvider.id === provider.id
        );
        const newKeyValue = providerKeys[provider.id];

        if (existingKey) {
          const payload = {
            organizationId: organization.id,
            aiModelProvider: provider,
            key: newKeyValue,
          };
          await aiModelService.updateAiModelKey(
            organization.id,
            existingKey.id,
            storedToken,
            payload
          );
          console.log(`Updated AI Model Key for provider ${provider.id}`);
        } else if (newKeyValue && newKeyValue.trim() !== "") {
          const payload = {
            organizationId: organization.id,
            aiModelProvider: provider,
            key: newKeyValue,
          };
          await aiModelService.createAiModelKey(
            organization.id,
            storedToken,
            payload
          );
          console.log(`Created new AI Model Key for provider ${provider.id}`);
        }
      }      
      // Fetch the updated keys
      dispatch(fetchOrganizationAiModelKeys({ organizationId: organization.id, storedToken }));
    } catch (error) {
      console.error("Failed to create AI Model Keys", error);
      setAlertMessage("Failed to create AI Model Keys!");
      setAlertOpen(true);
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
            {/* Informations  Section */}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{ mb: 2, color: theme.palette.primary.main }}
              >
                Information
              </Typography>
            </Grid>
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
          <Divider sx={{ mt: 20, mb: 4 }} />
          {/* LLMs  Section */}

          <Grid item xs={12}>
            <Typography
              variant="h6"
              sx={{ mb: 2, color: theme.palette.primary.main }}
            >
              Ai Model Provider Key
            </Typography>
          </Grid>

          {aiModelProviders.map((item) => (
            <Grid
              item
              xs={12}
              sm={12}
              md={6}
              sx={{ mt: 3, mb: 4 }}
              key={item.id}
            >
              <TextField
                fullWidth
                label={item.description}
                value={providerKeys[item.id] || ""}
                onChange={handleProviderKeyChange(item.id)}
              />
            </Grid>
          ))}
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
