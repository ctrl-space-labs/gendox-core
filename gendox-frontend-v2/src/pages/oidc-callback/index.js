import { useEffect } from 'react'
import userManager from 'src/services/authService'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import GendoxPageLoader from 'src/authentication/components/GendoxPageLoader'

const OidcCallbackPage = () => {
  useEffect(() => {
    // Handle the OIDC callback when the component mounts
    userManager
      .signinRedirectCallback()
      .then(() => {
        console.log('User signed in successfully! Waiting for user data to load...')
      })
      .catch(error => {
        console.error('Error handling OIDC redirect callback:', error)
      })
  }, [])

  return <GendoxPageLoader text='Signing you in…' />
}

OidcCallbackPage.pageConfig = {
  routeType: routeTypes.publicOnly
}

export default OidcCallbackPage
