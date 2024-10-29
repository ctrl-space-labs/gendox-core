// ** React Imports
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/router";
// ** MUI Imports
import Card from "@mui/material/Card";
import { styled } from "@mui/material/styles";
import MuiCardContent from "@mui/material/CardContent";
import authConfig from "src/configs/auth";

// ** Demo Imports
import PricingPlans from "src/views/gendox-components/sub-plans-components/PricingPlans";
import PricingHeader from "src/views/gendox-components/sub-plans-components/PricingHeader";
import PricingFooter from "src/views/gendox-components/sub-plans-components/PricingFooter";
import subscriptionPlanService from "src/gendox-sdk/subscriptionPlanService";

// ** Styled Components
const CardContent = styled(MuiCardContent)(({ theme }) => ({
  padding: `${theme.spacing(20, 36)} !important`,
  [theme.breakpoints.down("xl")]: {
    padding: `${theme.spacing(20)} !important`,
  },
  [theme.breakpoints.down("sm")]: {
    padding: `${theme.spacing(10, 5)} !important`,
  },
}));

const SubscriptionPlans = () => {
  const router = useRouter();
  const { organizationId } = router.query;
  const storedToken = window.localStorage.getItem(
    authConfig.storageTokenKeyName
  );
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planPeriod, setPlanPeriod] = useState("monthly");
  const [isBlurring, setIsBlurring] = useState(false);

  const handleChange = (e) => {
    if (e.target.checked) {
      setPlanPeriod("annually");
    } else {
      setPlanPeriod("monthly");
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchSubscriptionPlans();
      fetchOrganizationPlans();
    }
  }, [organizationId]);

  const fetchSubscriptionPlans = async () => {
    setIsBlurring(true);
    try {
      const response = await subscriptionPlanService.getActiveSubscriptionPlans(
        organizationId,
        storedToken
      );

      setSubscriptionPlans(response.data.content);

      setIsBlurring(false);
    } catch (error) {
      console.error("Failed to fetch subscription plans.");
      setIsBlurring(false);
    }
  };

  const fetchOrganizationPlans = async () => {
    setIsBlurring(true);
    try {
      const response = await subscriptionPlanService.getOrganizationPlans(
        organizationId,
        storedToken
      );
      if (response.data) {
        setCurrentPlan(response.data);
      } else {
        // If no plans were found in the response, clear the organizationPlan
        setCurrentPlan(null);
      }
      setIsBlurring(false);
    } catch (error) {
      console.error("Failed to fetch organization plans.");
      setIsBlurring(false);
    }
  };

  console.log("PLAN", currentPlan);
  return (
    <Card>
      <CardContent
        sx={{
          filter: isBlurring ? "blur(6px)" : "none",
          transition: "filter 0.3s ease",
        }}
      >
        <PricingHeader plan={planPeriod} handleChange={handleChange} />
        <PricingPlans
          planPeriod={planPeriod}
          subscriptionPlans={subscriptionPlans}
          currentPlan={currentPlan}
        />
      </CardContent>

      <CardContent sx={{ backgroundColor: "action.hover" }}>
        <PricingFooter subscriptionPlans={subscriptionPlans} />
      </CardContent>
    </Card>
  );
};

export default SubscriptionPlans;
