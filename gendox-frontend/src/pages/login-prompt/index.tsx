import { useEffect, useState, type ReactElement } from "react"
import { useRouter } from "next/router"
import { Lock, ExternalLink } from "lucide-react"
import BlankLayout from "src/@core/layouts/BlankLayout"
import { routeTypes } from "src/authentication/components/RouteHandler"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const LoginPromptPage = () => {
  const router = useRouter()
  const [popupBlocked, setPopupBlocked] = useState(false)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        console.warn("Gendox Untrusted origin:", event.origin)
        return
      }
      if (event.data && event.data.type === "LOGIN_SUCCESS") {
        router.push("/")
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [router])

  const handleLoginClick = () => {
    const width = 600
    const height = 600
    const left = window.screenX + (window.innerWidth - width) / 2
    const top = window.screenY + (window.innerHeight - height) / 2

    const popup = window.open(
      "/login",
      "loginPopup",
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popup) {
      setPopupBlocked(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-10 px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
          <p className="text-sm text-muted-foreground mb-8">
            You need to sign in to access this content. Click the button below
            to open the login window.
          </p>
          <Button onClick={handleLoginClick} size="lg">
            <Lock className="h-4 w-4 mr-2" />
            Sign In
          </Button>

          {popupBlocked && (
            <div className="mt-4 p-3 rounded-md bg-destructive/10 text-sm text-destructive">
              <p className="font-medium mb-1">Popup blocked</p>
              <p className="text-xs">
                Please allow popups for this site, or{" "}
                <Button variant="link" asChild className="h-auto p-0 text-xs text-destructive">
                  <a href="/login" className="inline-flex items-center gap-1">
                    open the login page directly
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

LoginPromptPage.getLayout = (page: ReactElement) => (
  <BlankLayout>{page}</BlankLayout>
)
LoginPromptPage.pageConfig = {
  routeType: routeTypes.publicOnly,
}

export default LoginPromptPage
