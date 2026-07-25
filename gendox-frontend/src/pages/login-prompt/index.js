import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LockIcon from '@mui/icons-material/Lock'
import { User } from 'oidc-client-ts'
import userManager from 'src/services/authService'
import { localStorageConstants } from 'src/utils/generalConstants'
import BlankLayout from "../../@core/layouts/BlankLayout";
import {routeTypes} from "../../authentication/components/RouteHandler";

const LoginPromptPage = ({ sx }) => {
  const router = useRouter()

  useEffect(() => {
    const handleMessage = async (event) => {
      // Validate the sender's origin.
      // Replace 'https://your-login-domain.com' with the actual origin of your login page.
      if (event.origin !== window.location.origin) {
        console.warn('Gendox Untrusted origin:', event.origin)
        return
      }


      // Check for the expected message type.
      if (event.data && event.data.type === 'LOGIN_SUCCESS') {
        console.log("Login Success event received.")

        // When this page runs as a cross-site iframe (the WP plugin admin screen) its
        // localStorage is partitioned, so it cannot see the session the popup just stored
        // in the app's first-party storage. The popup hands it over on the message instead,
        // and we persist our own copy here.
        const { oidcUser, userData } = event.data.payload || {}
        if (oidcUser) {
          try {
            await userManager.storeUser(User.fromStorageString(oidcUser))
            if (userData) {
              window.localStorage.setItem(localStorageConstants.userDataKey, JSON.stringify(userData))
            }
          } catch (storeError) {
            console.error('Failed to store the session received from the login popup:', storeError)
          }
        }

        // Full page load, not router.push: this window's auth provider already bootstrapped
        // with no user and won't re-read storage on a client-side navigation (leaving '/'
        // spinning forever).
        window.location.replace('/')
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [router])


  const handleLoginClick = () => {
    // Define popup dimensions
    const width = 600;
    const height = 600;
    // Calculate centered position
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    // Open a popup without noopener so window.opener is available in the popup
    const popup = window.open(
      '/login', // URL for your login page
      'loginPopup',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      console.error('Popup blocked. Please allow popups for this site.');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        ...sx,
      }}
    >
      <h1>Authentication Required</h1>
      <Button
        variant="contained"
        startIcon={<LockIcon />}
        onClick={handleLoginClick}
        sx={{ mt: 4 }}
      >
        Login
      </Button>
    </Box>
  )
}

LoginPromptPage.getLayout = (page) => <BlankLayout>{page}</BlankLayout>;
LoginPromptPage.pageConfig = {
  routeType: routeTypes.publicOnly,
};

export default LoginPromptPage
