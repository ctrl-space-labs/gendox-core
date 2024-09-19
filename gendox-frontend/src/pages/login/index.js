// ** React Imports
import {useEffect, useState} from "react";

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

const LoginPage = () => {
  // ** Hooks
  const auth = useAuth();

    useEffect(() => {
        auth.login();
    }, []);

  return (
      <div>Logging in...</div>
  )
};


LoginPage.getLayout = (page) => <BlankLayout>{page}</BlankLayout>;
LoginPage.guestGuard = true;

export default LoginPage;
