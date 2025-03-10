import React, {useContext, useEffect} from 'react';
import userManager from 'src/services/authService';
import BlankLayout from "src/@core/layouts/BlankLayout";
import {useAuth} from "src/authentication/useAuth";
import {routeTypes} from "../../authentication/components/RouteHandler"; // Ensure you have the correct path to your OIDC UserManager setup
import { LinearProgress } from '@mui/material'

const OidcCallbackPage = () => {
  const auth = useAuth()

  useEffect(() => {
    console.log('OidcCallbackPage mounted')

    // Handle the OIDC callback when the component mounts
    userManager
      .signinRedirectCallback()
      .then(() => {
        console.log('User signed in successfully! Waiting for user data to load...')
      })
      .catch(error => {
        // Log the error and redirect to an error page
        console.error('Error handling OIDC redirect callback:', error)
        // window.location.href = "/error";
      })
  }, [])

  return (
    // <div>Loading...</div> // Display a loading message while processing the callback
    <LinearProgress
      color='primary'
      sx={{
        height: 6, // Slightly thinner for a sleeker look
        borderRadius: 1, // Adds rounded corners
        mb: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.1)' // Subtle background for contrast
      }}
    />
  )
}

OidcCallbackPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
OidcCallbackPage.pageConfig = {
  routeType: routeTypes.publicOnly,
}

export default OidcCallbackPage
