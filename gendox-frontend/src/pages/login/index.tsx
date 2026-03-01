import { useEffect, type ReactElement } from "react"
import { useAuth } from "src/authentication/useAuth"
import BlankLayout from "src/@core/layouts/BlankLayout"
import { routeTypes } from "src/authentication/components/RouteHandler"

const LoginPage = () => {
  const auth = useAuth()

  useEffect(() => {
    auth.login()
  }, [])

  return <div className="flex items-center justify-center min-h-screen text-foreground">Logging in...</div>
}

LoginPage.getLayout = (page: ReactElement) => <BlankLayout>{page}</BlankLayout>
LoginPage.pageConfig = {
  routeType: routeTypes.publicOnly,
}

export default LoginPage
