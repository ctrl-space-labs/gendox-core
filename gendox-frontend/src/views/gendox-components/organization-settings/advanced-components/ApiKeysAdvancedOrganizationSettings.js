import { useState, useEffect, use } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@mui/material/styles";
import authConfig from "src/configs/auth";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Icon from "src/@core/components/icon";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import toast from "react-hot-toast";
import apiKeyService from "src/gendox-sdk/apiKeyService";
import CreateApiKeyDialog from "src/views/gendox-components/organization-settings/advanced-components/api-keys/CreateApiKeyDialog";
import NameChangeDialog from "src/views/gendox-components/organization-settings/advanced-components/api-keys/NameChangeDialog";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";
import { fetchApiKeys } from "src/store/apps/activeOrganization/activeOrganization";
import { copyToClipboard } from "src/utils/copyToClipboard";
import { getErrorMessage } from "src/utils/errorHandler";


const ApiKeysAdvancedOrganizationSettings = () => {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const organizationId = router.query.organizationId;
  const { apiKeys } = useSelector((state) => state.activeOrganization);

  const [selectedApiKeyId, setSelectedApiKeyId] = useState(null);
  const [selectedApiKeyName, setSelectedApiKeyName] = useState("");
  const [openNameChangeDialog, setOpenNameChangeDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState(null);

  // Function to open the NameChangeDialog and set the selected provider ID
  const handleEditToggle = (apiKeyId, name) => {
    setSelectedApiKeyId(apiKeyId);
    setSelectedApiKeyName(name);
    setOpenNameChangeDialog(true);
  };

  const handleCreateClickOpen = () => {
    setOpenCreateDialog(true);
  };

  // Handle creating a new API key
  const handleCreateApiKey = async (name) => {
    try {
      const payload = {
        organizationId,
        name,
        durationInDays: 100 * 365, // 100 years in days
        isActive: true,
      };

      await apiKeyService.createApiKey(organizationId, payload, storedToken);
      dispatch(
        fetchApiKeys({
          organizationId,
          storedToken,
        })
      );
      setOpenCreateDialog(false);
      toast.success("API Key Created Successfully");
    } catch (error) {
      console.error("Failed to create API Key", error);
      toast.error(`Failed to create API Key. Error: ${getErrorMessage(error)}`);
      setOpenCreateDialog(false);
    }
  };

  const handleUpdateApiKey = async (newName) => {
    try {
      const payload = {
        organizationId,
        name: newName,
        durationInDays: 100 * 365, // 100 years in days
        isActive: true,
      };

      await apiKeyService.updateApiKey(
        organizationId,
        selectedApiKeyId,
        payload,
        storedToken
      );
      dispatch(
        fetchApiKeys({
          organizationId,
          storedToken,
        })
      );
      setOpenNameChangeDialog(false);
      toast.success("Api Key Updated Successfully");
    } catch (error) {
      console.error("Failed to update Api Key", error);
      toast.error(`Failed to update API Key. Error: ${getErrorMessage(error)}`);
      setOpenNameChangeDialog(false);
    }
  };

  const handleDeleteProviderKey = async () => {
    try {
      await apiKeyService.deleteApiKey(
        organizationId,
        selectedApiKeyId,
        storedToken
      );
      dispatch(
        fetchApiKeys({
          organizationId,
          storedToken,
        })
      );
      handleDeleteClose();
      toast.success("Api Key Deleted Successfully");
    } catch (error) {
      console.error("Failed to delete Api Key", error);
      toast.error(`Failed to delete Api Key. Error: ${getErrorMessage(error)}`);
      handleDeleteClose();
    }
  };

  const handleDeleteClickOpen = (apiKeyId, name) => {
    setSelectedApiKeyId(apiKeyId);
    setSelectedApiKeyName(name);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => setOpenDeleteDialog(false);

  // ** Handle copy action
  const handleCopy = (apiKeyId, apiKey) => {
    copyToClipboard(apiKey);
    setCopiedKeyId(apiKeyId);
    setTimeout(() => {
      setCopiedKeyId(null); // Reset after a short delay
    }, 2000); // 2 seconds delay
  };

  return (
    <>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <span>API Keys</span>
            <Tooltip title="Create and manage API keys for Gendox access. Keys are secure and only visible at creation, so keep them safe!">
              <IconButton color="primary" sx={{ ml: 1 }}>
                <Icon icon="mdi:information-outline" />
              </IconButton>
            </Tooltip>
          </Box>
        }
        action={
          <Tooltip title="Create New API Key">
            <IconButton color="primary" onClick={handleCreateClickOpen}>
              <Icon icon="mdi:plus" />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {apiKeys.map((item) => (
          <Grid item xs={12} sm={12} md={6} sx={{ mt: 3, mb: 4 }} key={item.id}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TextField
                label="Name"
                value={item.name}
                disabled
                sx={{ mr: 2 }}
              />
              <TextField fullWidth label="Key" value={item.apiKey} disabled />
              <Box sx={{ display: "flex", ml: 1 }}>
                <Tooltip title="Copy">
                  <IconButton
                    onClick={() => handleCopy(item.id, item.apiKey)}
                    size="small"
                    sx={{
                      color: copiedKeyId === item.id ? "green" : "inherit",
                    }}
                  >
                    <Icon icon="mdi:content-copy" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Change Api Key's name">
                  <IconButton
                    onClick={() => handleEditToggle(item?.id, item?.name)}
                    color="primary"
                  >
                    <Icon icon="mdi:pencil-outline" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete Api Key">
                  <IconButton
                    onClick={() => {
                      handleDeleteClickOpen(item?.id, item?.name);
                    }}
                    color="error"
                  >
                    <Icon icon="mdi:delete" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        ))}
      </CardContent>

      {/* Render the NameChangeDialog */}
      <NameChangeDialog
        open={openNameChangeDialog}
        onClose={() => setOpenNameChangeDialog(false)}
        onSave={handleUpdateApiKey}
        name={selectedApiKeyName}
      />

      {/* Render the DeleteConfirmDialog */}
      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteProviderKey}
        title="Delete Api Key"
        contentText={`Are you sure you want to delete ${selectedApiKeyName}'s  Api Key ?`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />

      {/* Render the CreateApiKeyDialog */}
      <CreateApiKeyDialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        onSave={handleCreateApiKey}
      />
    </>
  );
};

export default ApiKeysAdvancedOrganizationSettings;
