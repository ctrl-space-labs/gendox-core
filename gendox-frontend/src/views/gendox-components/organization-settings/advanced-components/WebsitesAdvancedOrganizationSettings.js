import { useState, useEffect, use } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@mui/material/styles";
import authConfig from "src/configs/auth";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Icon from "src/@core/components/icon";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import toast from "react-hot-toast";
import OrganizationWebSiteDialog from "./organization-websites/OrganizationWebSiteDialog";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";
import { fetchOrganizationWebSites } from "src/store/apps/activeOrganization/activeOrganization";
import organizationWebSiteService from "src/gendox-sdk/organizationWebSiteService";

const WebsitesAdvancedOrganizationSettings = () => {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const organizationId = router.query.organizationId;
  const { organizationWebSites } = useSelector(
    (state) => state.activeOrganization
  );


  const [selectedWebSiteUrl, setSelectedWebSiteUrl] = useState(null);
  const [selectedWebSiteName, setSelectedWebSiteName] = useState("");
  const [selectedWebSiteId, setSelectedWebSiteId] = useState(null);
  const [openWebSiteDialog, setOpenWebSiteDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Function to open the NameChangeDialog and set the selected provider ID
  const handleEditToggle = (id, name, url) => {
    setSelectedWebSiteId(id);
    setSelectedWebSiteUrl(url);
    setSelectedWebSiteName(name);
    setOpenWebSiteDialog(true);
  };

  const handleCreateClickOpen = () => {
    setSelectedWebSiteUrl(null); 
    setSelectedWebSiteName("");
    setOpenWebSiteDialog(true);
  };

  const handleDeleteClickOpen = (id, name, url) => {
    setSelectedWebSiteId(id);
    setSelectedWebSiteUrl(url);
    setSelectedWebSiteName(name);
    setOpenDeleteDialog(true);
  };

  // Handle creating a new API key
  const handleCreateOrganizationWebsite = async (name, url) => {
    try {
      const payload = {
        organizationId,
        name,
        url
      };

      await organizationWebSiteService.createOrganizationWebSite(
        organizationId,
        payload,
        storedToken
      );
      dispatch(
        fetchOrganizationWebSites({
          organizationId,
          storedToken,
        })
      );
      setOpenWebSiteDialog(false);
      toast.success("Organization Website Created Successfully");
    } catch (error) {
      console.error("Failed to create Organization Website", error);
      toast.error("Failed to create Organization Website");
      setOpenWebSiteDialog(false);
    }
  };

  const handleUpdateOrganizationWebsite = async (newName, newUrl) => {
    try {
      const payload = {
        organizationId,
        name: newName,
        url: newUrl
      };

      await organizationWebSiteService.updateOrganizationWebSite(
        organizationId,
        selectedWebSiteId,
        payload,
        storedToken
      );
      dispatch(
        fetchOrganizationWebSites({
          organizationId,
          storedToken,
        })
      );
      setOpenWebSiteDialog(false);
      toast.success("Organization Website Updated Successfully");
    } catch (error) {
      console.error("Failed to update Organization Website", error);
      toast.error("Failed to update Organization Website");
      setOpenWebSiteDialog(false);
    }
  };

  const handleDeleteOrganizationWebsite = async () => {
    try {
      await organizationWebSiteService.deleteOrganizationWebSite(
        organizationId,
        selectedWebSiteId,
        storedToken
      );
      dispatch(
        fetchOrganizationWebSites({
          organizationId,
          storedToken,
        })
      );
      handleDeleteClose();
      toast.success("Organization Website Deleted Successfully");
    } catch (error) {
      console.error("Failed to delete Organization Website", error);
      toast.error("Failed to delete Organization Website");
      handleDeleteClose();
    }
  };  

  const handleDeleteClose = () => setOpenDeleteDialog(false);

  return (
    <Card>
      <CardHeader
        title="Web Sites"
        action={
          <Tooltip title="Create New Web Site">
            <IconButton color="primary" onClick={handleCreateClickOpen}>
              <Icon icon="mdi:plus" />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {organizationWebSites.map((item) => (
          <Grid item xs={12} sm={12} md={6} sx={{ mt: 3, mb: 4 }} key={item.id}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <TextField
                label="Name"
                value={item.name}
                disabled
                sx={{ mr: 2 }}
              />
              <TextField fullWidth label="URL" value={item.url} disabled />
              <Box sx={{ display: "flex", ml: 1 }}>
                <Tooltip title="Update Web Site">
                  <IconButton
                    onClick={() =>
                      handleEditToggle(item?.id, item?.name, item?.url)
                    }
                    color="primary"
                  >
                    <Icon icon="mdi:pencil-outline" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete Web Site">
                  <IconButton
                    onClick={() => {
                      handleDeleteClickOpen(item?.id, item?.name, item?.url);
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
      <OrganizationWebSiteDialog
        open={openWebSiteDialog}
        onClose={() => setOpenWebSiteDialog(false)}
        onSave={selectedWebSiteUrl ? handleUpdateOrganizationWebsite : handleCreateOrganizationWebsite}
        name={selectedWebSiteName}
        url={selectedWebSiteUrl}
        
      />

      {/* Render the DeleteConfirmDialog */}
      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteOrganizationWebsite}
        title="Delete Organization Website"
        contentText={`Are you sure you want to delete ${selectedWebSiteName}'s  Organization Website ?`}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </Card>
  );
};

export default WebsitesAdvancedOrganizationSettings;
