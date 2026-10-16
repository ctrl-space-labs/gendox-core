import { useEffect } from 'react'
import userManager from 'src/services/authService'
import { routeTypes } from 'src/authentication/components/RouteHandler'

const SilentRenewPage = () => {
  // This is handled by AuthProvider
  useEffect(() => {
    console.log('Silently Renewing session...')
    userManager.signinSilentCallback().catch(error => {
      console.error('Silent sign-in error:', error)
    })
  }, [])

  return <div>Renewing session...</div>
}

SilentRenewPage.pageConfig = {
  routeType: routeTypes.publicOnly
}

export default SilentRenewPage
