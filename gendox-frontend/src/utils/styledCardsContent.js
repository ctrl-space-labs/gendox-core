import { styled } from "@mui/material/styles";
import CardContent from "@mui/material/CardContent";


export const StyledCardContent = styled(CardContent)(({ theme }) => ({
    paddingTop: `${theme.spacing(10)} !important`,
    paddingBottom: `${theme.spacing(8)} !important`,
    [theme.breakpoints.up("sm")]: {
      paddingLeft: `${theme.spacing(20)} !important`,
      paddingRight: `${theme.spacing(20)} !important`,
    },
  }));