import React, { useEffect } from 'react'
import userManager from 'src/services/authService'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { routeTypes } from 'src/authentication/components/RouteHandler'

const SilentRenewPage = () => {
  useEffect(() => {
    console.log('Silently Renewing session...')
    userManager.signinSilentCallback().catch((error: any) => {
      console.error('Silent sign-in error:', error)
    })
  }, [])

  return <div>Renewing session...</div>
}

SilentRenewPage.getLayout = (page: React.ReactNode) => <BlankLayout>{page}</BlankLayout>
SilentRenewPage.pageConfig = {
  routeType: routeTypes.publicOnly,
}

export default SilentRenewPage
