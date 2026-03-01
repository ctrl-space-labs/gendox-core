import { useEffect, type ReactElement } from "react"
import { useRouter } from "next/router"
import { Lock } from "lucide-react"
import BlankLayout from "src/@core/layouts/BlankLayout"
import { routeTypes } from "src/authentication/components/RouteHandler"
import { Button } from "@/components/ui/button"

const LoginPromptPage = () => {
  const router = useRouter()

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        console.warn("Gendox Untrusted origin:", event.origin)
        return
      }
      if (event.data && event.data.type === "LOGIN_SUCCESS") {
        console.log("Login Success event received.")
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
      console.error("Popup blocked. Please allow popups for this site.")
    }
  }

  return (
    <div className="h-screen flex items-center flex-col justify-center">
      <h1 className="text-3xl font-bold text-foreground">
        Authentication Required
      </h1>
      <Button onClick={handleLoginClick} className="mt-4">
        <Lock className="mr-2 h-4 w-4" />
        Login
      </Button>
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
