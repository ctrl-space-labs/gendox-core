// CustomToast.js
import React, { useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '@mui/material/styles';

const CustomToast = () => {
  const theme = useTheme();

  // Extract colors from your custom theme options.
  const { customColors } = theme.palette;
  const primaryGradient = customColors?.primaryGradient || '#6ACDFF';
  const mainColorRGBA = customColors?.main || '75, 77, 99';


  const toastOptions = useMemo(() => ({
    style: {
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
      fontFamily: theme.typography.fontFamily,
      borderRadius: '8px',
      padding: '16px',
      boxShadow: theme.shadows[4],
    },
    success: {
      style: {
        background: theme.palette.background.paper,
        color: theme.palette.text.primary,
      },
    },
    error: {
      style: {
        background: theme.palette.error.main,
        color: theme.palette.getContrastText(theme.palette.error.main),
      },
    },
  }), [theme, primaryGradient]);

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={toastOptions}
    />
  );
};

export default CustomToast;
