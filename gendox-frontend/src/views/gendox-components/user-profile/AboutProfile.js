import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import Icon from "src/@core/components/icon";
import { useAuth } from "src/hooks/useAuth";

const UserInfo = ({ user }) => {
  // Prepare user info entries, filtering out null or undefined values
  const userInfoEntries = Object.entries(user).filter(
    ([key, value]) => value != null && key !== "organizations"
  );

  return (
    <Box sx={{ mb: 7 }}>
      {userInfoEntries.map(([key, value], index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            alignItems: "center",
            "&:not(:last-of-type)": { mb: 2 },
          }}
        >
          <Icon icon="mdi:check" sx={{ mr: 2, color: "text.secondary" }} />{"  "}
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, minWidth: "120px" }}
          >
            {`${key.charAt(0).toUpperCase() + key.slice(1)}:`}
          </Typography>
          <Typography sx={{ color: "text.secondary", flexGrow: 1 }}>
            {typeof value === "string"
              ? value.charAt(0).toUpperCase() + value.slice(1)
              : value.toString()}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const AboutProfile = () => {
  const { user } = useAuth();

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography
              variant="body2"
              sx={{ mb: 4, color: "text.disabled", textTransform: "uppercase" }}
            >
              About
            </Typography>
            <UserInfo user={user} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default AboutProfile;
