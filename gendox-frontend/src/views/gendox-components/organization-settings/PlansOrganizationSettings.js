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

import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";

import organizationService from "src/gendox-sdk/organizationService";

const PlansOrganizationSettings = () => {
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

  useEffect(() => {
    if (organizationId) {
      fetchOrganizationPlans();
    }
  }, [organizationId]);

  const fetchOrganizationPlans = async () => {
    setIsBlurring(true);
    try {
      const response = await organizationService.getOrganizationPlans(
        organizationId,
        storedToken
      );
      if (response.data.content.length > 0) {
        setOrganizationPlan(response.data.content[0]);
      }
        setIsBlurring(false);
    } catch (error) {
      console.error("Failed to fetch organization plans.");
        setIsBlurring(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Organization Plan Details" />
      <CardContent sx={{filter: isBlurring ? "blur(6px)" : "none",
        transition: "filter 0.3s ease",}}>
        <Grid container spacing={5}>
          {/* Subscription Plan Details */}
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

          {/* Dates */}
          <Grid item xs={12} sm={12} md={6}>
            <TextField
              fullWidth
              id="organization-start-date"
              label="Start Date"
              value={
                new Date(organizationPlan?.startDate).toLocaleDateString() || ""
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

          {/* Rate Limits */}
          <Grid item xs={12} sm={12} md={6}>
            <TextField
              fullWidth
              id="organization-rate-limit"
              label="Rate Limit (Completions per Minute)"
              value={organizationPlan?.apiRateLimit?.completionsPerMinute || ""}
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
                organizationPlan?.apiRateLimit?.publicCompletionsPerMinute || ""
              }
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>

          {/* Additional Info */}
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
      </CardContent>
      <Divider sx={{ m: "0 !important" }} />
    </Card>
  );
};

export default PlansOrganizationSettings;
