// ** React Imports
import { useState, useEffect } from "react";

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
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import toast from "react-hot-toast";

import subscriptionPlanService from "src/gendox-sdk/subscriptionPlanService";
import DeleteConfirmDialog from "src/utils/dialogs/DeleteConfirmDialog";

const PlansOrganizationSettings = () => {
  const theme = useTheme();

  const router = useRouter();
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  const organization = useSelector(
    (state) => state.activeOrganization.activeOrganization
  );
  const { id: organizationId } = organization;

  const [organizationPlan, setOrganizationPlan] = useState([]);
  const [isBlurring, setIsBlurring] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    if (organizationId) {
      fetchOrganizationPlans();
    }
  }, [organizationId]);

  const fetchOrganizationPlans = async () => {
    setIsBlurring(true);
    try {
      const response = await subscriptionPlanService.getOrganizationPlans(
        organizationId,
        storedToken
      );
      console.log("RESPONSE", response);
      if (response.data) {
        setOrganizationPlan(response.data);
      } else {
        // If no plans were found in the response, clear the organizationPlan
        setOrganizationPlan(null);
      }

      setIsBlurring(false);
    } catch (error) {
      console.error("Failed to fetch organization plans.");
      setIsBlurring(false);
    }
  };

  const handleCancelSubscription = () => setOpenDeleteDialog(true);

  const confirmCancel = async () => {
    try {
      await subscriptionPlanService.cancelSubscriptionPlan(
        organizationPlan.id,
        organizationId,
        storedToken
      );
      setOrganizationPlan(null);
      toast.success("Subscription canceled successfully");
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error("Failed to cancel subscription");
    }
    setOpenDeleteDialog(false);
  };

  const handleUpgrade = () =>
    router.push(`/gendox/sub-plans/?organizationId=${organizationId}`);
  const handleDeleteClose = () => setOpenDeleteDialog(false);

  return (
    <Card>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
        }}
      >
        <CardHeader title="Subscription Plan Details" />

        {organizationPlan && (
          <Button
            variant="outlined"
            color="primary"
            onClick={handleUpgrade}
            sx={{
              padding: "12px 24px",
              fontSize: "1.1rem",
            }}
          >
            Upgrade Plan
          </Button>
        )}
      </Box>
      <CardContent
        sx={{
          filter: isBlurring ? "blur(6px)" : "none",
          transition: "filter 0.3s ease",
        }}
      >
        {organizationPlan ? (
          <Grid container spacing={5}>
            {/* Plan Info Section */}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{ mb: 2, color: theme.palette.primary.main }}
              >
                Plan Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-subscription-plan-name"
                label="Subscription Plan Name"
                value={organizationPlan?.subscriptionPlan?.name || ""}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-subscription-plan-description"
                label="Subscription Plan Description"
                value={organizationPlan?.subscriptionPlan?.description || ""}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-subscription-plan-price"
                label="Subscription Plan Price"
                value={
                  organizationPlan?.subscriptionPlan?.price
                    ? `${organizationPlan.subscriptionPlan.price} ${organizationPlan.subscriptionPlan.currency}`
                    : ""
                }
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            {/* Date Section */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Typography
                variant="h6"
                sx={{ mb: 2, color: theme.palette.primary.main }}
              >
                Subscription Dates
              </Typography>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-start-date"
                label="Start Date"
                value={
                  new Date(organizationPlan?.startDate).toLocaleDateString() ||
                  ""
                }
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-end-date"
                label="End Date"
                value={
                  new Date(organizationPlan?.endDate).toLocaleDateString() || ""
                }
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            {/* Rate Limits Section */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Typography
                variant="h6"
                sx={{ mb: 2, color: theme.palette.primary.main }}
              >
                API Rate Limits
              </Typography>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-rate-limit"
                label="Rate Limit (Completions per Minute)"
                value={
                  organizationPlan?.apiRateLimit?.completionsPerMinute || ""
                }
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-rate-limit-public"
                label="Public Rate Limit (Completions per Minute)"
                value={
                  organizationPlan?.apiRateLimit?.publicCompletionsPerMinute ||
                  ""
                }
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>

            {/* Additional Info Section */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Typography
                variant="h6"
                sx={{ mb: 2, color: theme.palette.primary.main }}
              >
                Additional Information
              </Typography>
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-number-of-seats"
                label="Number of Seats"
                value={organizationPlan?.numberOfSeats || ""}
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-messages-limit"
                label="User Message Monthly Limit"
                value={
                  organizationPlan?.subscriptionPlan
                    ?.userMessageMonthlyLimitCount || ""
                }
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={12} md={6}>
              <TextField
                fullWidth
                id="organization-upload-limit"
                label="User Upload Limit (MB)"
                value={
                  organizationPlan?.subscriptionPlan?.userUploadLimitMb || ""
                }
                InputProps={{
                  readOnly: true,
                }}
              />
            </Grid>
          </Grid>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "200px",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{ mb: 2, color: theme.palette.text.secondary }}
            >
              No active subscription plan found.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleUpgrade}
              sx={{
                padding: "12px 24px",
                fontSize: "1.1rem",
              }}
            >
              Upgrade Plan
            </Button>
          </Box>
        )}
      </CardContent>

      {organizationPlan && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            p: 2,
          }}
        >
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelSubscription}
          >
            Subscription Cancel
          </Button>
        </Box>
      )}

      <Divider sx={{ m: "0 !important" }} />

      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        onConfirm={confirmCancel}
        title="Cancel Subscription"
        contentText={`Are you sure you want to cancel the subscription?`}
        confirmButtonText="Yes, Cancel"
        cancelButtonText="No, Keep"
      />
    </Card>
  );
};

export default PlansOrganizationSettings;
