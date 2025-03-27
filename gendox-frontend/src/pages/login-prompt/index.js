import React, {useEffect} from 'react'
import { Box, Button } from '@mui/material'
import LockIcon from '@mui/icons-material/Lock'
import {routeTypes} from "../../authentication/components/RouteHandler";
import LoginPage from "../login";
import BlankLayout from "../../@core/layouts/BlankLayout";
import {localStorageConstants} from "../../utils/generalConstants";
import {useRouter} from "next/router";

/**
 * LoginPromptPage is used only in the Gendox WP Plugin admin page.
 * There is an iframe showing the Gendox app.
 * Normally, when the user is unauthenticated, it should be redirected to Keycloak.
 * Keycloak is protected with CORS, so the user will see a blank page.
 *
 * This component is used to show a Login button that opens Gendox in another tab
 * for the users to login as per normal, then the user can return in the iframe and see the app.
 *
 * @param sx styling overrides
 * @return {JSX.Element}
 * @constructor
 */
const LoginPromptPage = ({ sx }) => {

  const router = useRouter()


  const handleLoginClick = () => {
    window.open('/', '_blank', 'noopener,noreferrer')
  }

  // Handle storage events from other tabs
  useEffect(() => {
    if (window.localStorage.getItem(localStorageConstants.accessTokenKey)) {
      router.push('/')
      return
    }

    const handleStorage = (event) => {
      // Check if the access token key was updated and has a value
      if (
        event.key === localStorageConstants.accessTokenKey &&
        event.newValue
      ) {
        router.push('/')
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [router])

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
      <p>You need to login to access this page</p>
      <Button
        variant="contained"
        startIcon={<LockIcon />}
        onClick={handleLoginClick}
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
