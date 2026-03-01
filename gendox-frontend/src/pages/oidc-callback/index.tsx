import React, { useEffect } from 'react'
import userManager from 'src/services/authService'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { useAuth } from 'src/authentication/useAuth'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import { Progress } from '@/components/ui/progress'

const OidcCallbackPage = () => {
  const auth = useAuth()

  useEffect(() => {
    console.log('OidcCallbackPage mounted')

    userManager
      .signinRedirectCallback()
      .then(() => {
        console.log('User signed in successfully! Waiting for user data to load...')
      })
      .catch((error: any) => {
        console.error('Error handling OIDC redirect callback:', error)
      })
  }, [])

  return (
    <Progress value={undefined} className="h-1.5 rounded mb-2" />
  )
}

OidcCallbackPage.getLayout = (page: React.ReactNode) => <BlankLayout>{page}</BlankLayout>
OidcCallbackPage.pageConfig = {
  routeType: routeTypes.publicOnly,
}

export default OidcCallbackPage
