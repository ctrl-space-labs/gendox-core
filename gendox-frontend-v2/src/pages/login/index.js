import { useEffect } from 'react'
import { useAuth } from 'src/authentication/useAuth'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import GendoxPageLoader from 'src/authentication/components/GendoxPageLoader'

const LoginPage = () => {
  const auth = useAuth()

  useEffect(() => {
    auth.login()
  }, [])

  return <GendoxPageLoader text='Signing you in…' />
}

LoginPage.pageConfig = {
  routeType: routeTypes.publicOnly
}

export default LoginPage
