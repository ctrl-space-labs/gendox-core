import { useState, useEffect, use } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@mui/material/styles";
import authConfig from "src/configs/auth";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Icon from "src/@core/components/icon";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import toast from "react-hot-toast";
import aiModelService from "src/gendox-sdk/aiModelService";
import KeyChangeDialog from "src/views/gendox-components/organization-settings/general-components/KeyChangeDialog";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";
import { fetchOrganizationAiModelKeys } from "src/store/apps/activeOrganization/activeOrganization";

const GeneralOrganizationSettings = () => {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const organizationId = router.query.organizationId;
  const { aiModelProviders, aiModelKeys: initialAiModelKeys } = useSelector(
    (state) => state.activeOrganization
  );

  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const [openKeyChangeDialog, setOpenKeyChangeDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedProviderDescription, setSelectedProviderDescription] =
    useState("");
  const [selectedProviderId, setSelectedProviderId] = useState(null);
  const [aiModelKeys, setAiModelKeys] = useState([]);

  useEffect(() => {
    if (initialAiModelKeys) {
      setAiModelKeys(initialAiModelKeys);
    }
  }, [initialAiModelKeys]);

  // Function to open the KeyChangeDialog and set the selected provider ID
  const handleEditToggle = (description, providerId) => {
    setSelectedProviderDescription(description);
    setSelectedProviderId(providerId);
    setOpenKeyChangeDialog(true);
  };

  // Function to handle saving the new key
  const handleSaveNewKey = async (newKey) => {
    // // create new ai model provider keys
    try {
      const provider = aiModelProviders.find(
        (p) => p.id === selectedProviderId
      );

      if (!provider) {
        console.error("Provider not found");
        return;
      }

      const existingKey = aiModelKeys.find(
        (key) => key.aiModelProvider.id === provider.id
      );

      const payload = {
        organizationId,
        aiModelProvider: provider,
        key: newKey,
      };

      if (!existingKey) {
        await aiModelService.createAiModelKey(
          organizationId,
          storedToken,
          payload
        );
        toast.success("AI Model Key Created Successfully");
      } else {
        // Update the existing key
        await aiModelService.updateAiModelKey(
          organizationId,
          existingKey.id,
          storedToken,
          payload
        );
        toast.success("AI Model Key Updated Successfully");
      }

      // Fetch the updated keys
      dispatch(
        fetchOrganizationAiModelKeys({
          organizationId,
          storedToken,
        })
      );
      setOpenKeyChangeDialog(false);
    } catch (error) {
      console.error("Failed to create AI Model Keys", error);
      toast.error("Failed to save AI Model Key");
      setOpenKeyChangeDialog(false);
    }
  };

  const handleDeleteProviderKey = async () => {
    try {
      await aiModelService.deleteAiModelKey(
        organizationId,
        selectedKeyId,
        storedToken
      );
      dispatch(
        fetchOrganizationAiModelKeys({
          organizationId,
          storedToken,
        })
      );
      handleDeleteClose();
      toast.success("AI Model Key Deleted Successfully");
    } catch (error) {
      console.error("Failed to delete AI Model Key", error);
      toast.error("Failed to delete AI Model Key");
      handleDeleteClose();
    }
  };

  const handleDeleteClickOpen = (description, keyId) => {
    setSelectedProviderDescription(description);
    setSelectedKeyId(keyId);
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => setOpenDeleteDialog(false);

  return (
    <Card>
      <Grid item xs={12}>
        <Typography
          variant="h6"
          sx={{ mb: 6, color: theme.palette.primary.main }}
        >
          AI Model Provider Key
        </Typography>
      </Grid>

      {aiModelProviders.map((item) => (
        <Grid item xs={12} sm={12} md={6} sx={{ mt: 3, mb: 4 }} key={item.id}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <TextField
              fullWidth
              label={item.description}
              value={
                aiModelKeys.find((key) => key.aiModelProvider.id === item.id)
                  ?.key || ""
              }
              disabled
            />
            <Box sx={{ display: "flex", ml: 1 }}>
              <Tooltip title="Add New Key">
                <IconButton
                  onClick={() => handleEditToggle(item.description, item.id)}
                  color="primary"
                >
                  <Icon icon="mdi:pencil-outline" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Key">
                <IconButton
                  onClick={() => {
                    const matchingKey = aiModelKeys.find(
                      (key) => key.aiModelProvider.id === item.id
                    );
                    handleDeleteClickOpen(item.description, matchingKey?.id);
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

      {/* Render the KeyChangeDialog */}
      <KeyChangeDialog
        open={openKeyChangeDialog}
        onClose={() => setOpenKeyChangeDialog(false)}
        onSave={handleSaveNewKey}
        description={selectedProviderDescription}
      />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteProviderKey}
        title="Delete AI Model Key"
        contentText={`Are you sure you want to delete the AI Model Key for ${selectedProviderDescription}?`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </Card>
  );
};

export default GeneralOrganizationSettings;
