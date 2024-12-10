// ** MUI Imports
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Icon from "src/@core/components/icon";
import CustomChip from "src/@core/components/mui/chip";
import PlanDetails from "./PlanDetails";

// import { hexToRGBA } from "src/@core/utils/hex-to-rgba";

const BoxWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(6),
  paddingTop: theme.spacing(14.75),
  borderRadius: theme.shape.borderRadius,
}));

const BoxFeature = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(5),
  "& > :not(:first-of-type)": {
    marginTop: theme.spacing(4),
  },
}));

const planIcons = [
  "mdi:gift-outline", // Free
  "mdi:star-outline", // Basic
  "mdi:rocket-launch-outline", // Pro
  "mdi:briefcase-outline", // Business
];
const defaultIcon = "mdi:microsoft-dynamics-365";

const PricingPlans = (props) => {
  // ** Props
  const { planPeriod, subscriptionPlans, currentPlan } = props;

  const sortedPlans = subscriptionPlans?.sort((a, b) => a.price - b.price);

  const handleButtonClick = (plan) => {
    console.log(`Button clicked for plan: ${plan.name}, Price: ${plan.price}`);
  };


  return (
    <Grid container spacing={6}>
      {sortedPlans?.map((plan, index) => {
        const icon = index < planIcons.length ? planIcons[index] : defaultIcon;
        const annuallyCost = plan.price * 12 * 0.9;
        const isPopularPlan = plan?.sku === "gd-pro-001";
        const isCurrentPlan = plan?.id === currentPlan?.subscriptionPlan?.id;

        return (
          <Grid item xs={12} md={4} key={plan.name.toLowerCase()}>
            <BoxWrapper
              sx={{
                border: (theme) =>
                  isCurrentPlan
                    ? `2px solid ${theme.palette.success.main}` // Special border for current plan
                    : isPopularPlan
                    ? `2px solid ${theme.palette.primary.main}` // Popular plan border
                    : `1px solid ${theme.palette.divider}`, // Default border for others
              }}
            >
              {isPopularPlan ? (
                <CustomChip
                  skin="light"
                  label="Popular"
                  color="primary"
                  sx={{
                    top: 12,
                    right: 12,
                    height: 24,
                    position: "absolute",
                    "& .MuiChip-label": {
                      px: 1.75,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    },
                  }}
                />
              ) : null}

              <Box
                sx={{
                  mb: 5,
                  display: "flex",
                  justifyContent: "center",
                  "& svg": {
                    fontSize: 60,
                    color: "primary.main",
                  },
                }}
              >
                <Icon icon={icon} />
              </Box>

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" sx={{ mb: 1.5 }}>
                  {plan?.name}
                </Typography>
                <Typography variant="body2">{plan?.description}</Typography>
                <Box sx={{ my: 7, position: "relative" }}>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <Typography
                      variant="body2"
                      sx={{ mt: 1.6, fontWeight: 600, alignSelf: "flex-start" }}
                    >
                      <Icon icon="mdi:currency-eur" />
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 600,
                        color: "primary.main",
                        lineHeight: 1.17,
                      }}
                    >
                      {planPeriod === "monthly"
                        ? plan?.price
                        : annuallyCost / 12}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mb: 1.6, fontWeight: 600, alignSelf: "flex-end" }}
                    >
                      /month
                    </Typography>
                  </Box>
                  {planPeriod !== "monthly" &&
                  sortedPlans?.monthlyPrice !== 0 ? (
                    <Typography
                      variant="caption"
                      sx={{
                        top: 50,
                        left: "50%",
                        position: "absolute",
                        transform: "translateX(-50%)",
                      }}
                    >{`EURO ${annuallyCost}/year`}</Typography>
                  ) : null}
                </Box>
              </Box>

              <PlanDetails plan={plan}/>
              
              <Button
                fullWidth
                color={isCurrentPlan ? "success" : "primary"}
                variant={plan?.popularPlan ? "contained" : "outlined"}
                disabled={isCurrentPlan}
                onClick={() => handleButtonClick(plan)}
              >
                {isCurrentPlan ? "Your Current Plan" : "Upgrade"}
              </Button>
            </BoxWrapper>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default PricingPlans;
