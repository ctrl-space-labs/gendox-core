import { useState, useEffect, use } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "src/hooks/useAuth";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import authConfig from "src/configs/auth";
import { StyledCardContent } from "src/utils/styledCardsContent";
import { fetchOrganization, fetchAiModelProviders, fetchOrganizationAiModelKeys, fetchOrganizationPlans } from "src/store/apps/activeOrganization/activeOrganization";
import OrganizationSettingsCard from "src/views/gendox-components/organization-settings/OrganizationSettingsCard";
import aiModelService from "src/gendox-sdk/aiModelService";

const OrganizationSettings = () => {
  const auth = useAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const { organizationId } = router.query;
  const [isBlurring, setIsBlurring] = useState(false);

  const organization = useSelector(
    (state) => state.activeOrganization.activeOrganization
  );

  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );

  useEffect(() => {
    if (organizationId) {
      dispatch(fetchAiModelProviders({ organizationId, storedToken }));
      dispatch(fetchOrganization({ organizationId, storedToken }));
      dispatch(fetchOrganizationAiModelKeys({ organizationId, storedToken }));
      dispatch(fetchOrganizationPlans({ organizationId, storedToken }));
    }
    // }
  }, [organizationId, router, dispatch]);

  return (
    <Card
      sx={{
        backgroundColor: "transparent",
        boxShadow: "none",
        filter: isBlurring ? "blur(6px)" : "none",
        transition: "filter 0.3s ease",
      }}
    >
      <StyledCardContent sx={{ backgroundColor: "background.paper" }}>
        <Box sx={{ textAlign: "left" }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, color: "text.secondary", mb: 2 }}
          >
            Organization Settings
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 400, color: "primary.main" }}
          >
            {organization?.name || "No Selected"}
          </Typography>
        </Box>
      </StyledCardContent>
      <Box sx={{ height: 20 }} />
      <OrganizationSettingsCard />
    </Card>
  );
};

export default OrganizationSettings;
