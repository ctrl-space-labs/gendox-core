// ** React Imports
import { useState } from "react";

// ** Next Imports
import Link from "next/link";

// ** MUI Components
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { styled, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

// ** Icon Imports
import Icon from "src/@core/components/icon";

// ** Third Party Imports
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

// ** Hooks
import { useAuth } from "src/hooks/useAuth";
import { useSettings } from "src/@core/hooks/useSettings";

// ** Configs
import themeConfig from "src/configs/themeConfig";

// ** Layout Import
import BlankLayout from "src/@core/layouts/BlankLayout";

const StyledWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh", // Full viewport height
  width: "100vw", // Full viewport width
  position: "relative", // For layering content on top of the background
}));

const BoxWrapper = styled(Box)(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.down("md")]: {
    maxWidth: 400,
  },
}));

const TypographyStyled = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  letterSpacing: "0.18px",
  marginBottom: theme.spacing(1.5),
  [theme.breakpoints.down("md")]: { marginTop: theme.spacing(8) },
}));

const FormContainer = styled(Box)(({ theme }) => ({
  width: 400,
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  boxShadow: theme.shadows[5],
}));

const schema = yup.object().shape({
  email: yup.string().email().required(),
  password: yup.string().min(5).required(),
});

const defaultValues = {
  email: "admin@materialize.com",
  password: "admin",
};

const LoginPage = () => {
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // ** Hooks
  const auth = useAuth();
  const theme = useTheme();
  const { settings } = useSettings();

  // ** Vars
  const { skin } = settings;

  const {
    control,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: "onBlur",
    resolver: yupResolver(schema),
  });

  const onSubmit = (data) => {
    const { email, password } = data;
    auth.login({ email, password, rememberMe }, () => {
      setError("email", {
        type: "manual",
        message: "Email or Password is invalid",
      });
    });
  };

  return (
    <StyledWrapper
      sx={{
        backgroundImage:
          settings.mode === "light"
            ? `url('/images/gendox-background-light.webp')`
            : `url('/images/gendox-background-dark.webp')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Box
        sx={{
          p: 10,                   
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.paper",
          borderRadius: "10px",          
          border: `1px solid ${theme.palette.primary.main}`,
        }}
      >
        <BoxWrapper>
          <Box
            sx={{
              mb: 6,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "50px 40px",
              }}
            >
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundImage: "url('/images/gendoxLogo.svg')",
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              />
            </Box>
            <TypographyStyled variant="h5">{`Welcome to ${themeConfig.templateName}! 👋🏻`}</TypographyStyled>
            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                color: "text.secondary",
                maxWidth: 300,
                margin: "auto",
                marginBottom: 1,
                marginTop: 4,
                mx: "auto",
              }}
            >
              Please sign-in to your account and start the adventure
            </Typography>
          </Box>

          <form noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
            <Button
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              sx={{ mb: 7 }}
            >
              Login
            </Button>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Typography sx={{ mr: 2, color: "text.secondary" }}>
                New on our platform?
              </Typography>
              <Typography
                href="/register"
                component={Link}
                sx={{ color: "primary.main", textDecoration: "none" }}
              >
                Create an account
              </Typography>
            </Box>
            {/* <Divider
                sx={{
                  "& .MuiDivider-wrapper": { px: 4 },
                  mt: (theme) => `${theme.spacing(5)} !important`,
                  mb: (theme) => `${theme.spacing(7.5)} !important`,
                }}
              >
                or
              </Divider> */}
            {/* <SocialLoginButtons /> */}
          </form>
        </BoxWrapper>
      </Box>
    </StyledWrapper>
  );
};

// const SocialLoginButtons = () => {
//   const icons = [
//     { name: "facebook", color: "#497ce2" },
//     { name: "twitter", color: "#1da1f2" },
//     { name: "github", color: "text.primary" },
//     { name: "google", color: "#db4437" },
//   ];

//   return (
//     <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
//       {icons.map((icon) => (
//         <IconButton
//           key={icon.name}
//           sx={{ color: icon.color }}
//           onClick={(e) => e.preventDefault()}
//         >
//           <Icon icon={`mdi:${icon.name}`} />
//         </IconButton>
//       ))}
//     </Box>
//   );
// };

LoginPage.getLayout = (page) => <BlankLayout>{page}</BlankLayout>;
LoginPage.guestGuard = true;

export default LoginPage;
