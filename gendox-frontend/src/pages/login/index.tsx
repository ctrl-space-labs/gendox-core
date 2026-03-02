import { useEffect, type ReactElement } from "react"
import { useAuth } from "src/authentication/useAuth"
import BlankLayout from "src/@core/layouts/BlankLayout"
import { Spinner } from "@/components/ui/spinner"
import { routeTypes } from "src/authentication/components/RouteHandler"

const LoginPage = () => {
  const auth = useAuth()

  useEffect(() => {
    auth.login()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-foreground">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Signing in...</p>
    </div>
  )
}

LoginPage.getLayout = (page: ReactElement) => <BlankLayout>{page}</BlankLayout>
LoginPage.pageConfig = {
  routeType: routeTypes.publicOnly,
}

export default LoginPage
