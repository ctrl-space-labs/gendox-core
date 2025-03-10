import { styled } from "@mui/material/styles";
import CardContent from "@mui/material/CardContent";


export const ResponsiveCardContent = styled(CardContent)(({ theme }) => ({
  paddingTop: "2rem",
  paddingBottom: "2rem",
  [theme.breakpoints.up("sm")]: {
    paddingLeft: "4rem",
    paddingRight: "4rem",
  },
  [theme.breakpoints.down("sm")]: {
    paddingLeft: "1rem",
    paddingRight: "1rem",
  },
  }));
