import React, { useEffect } from "react"
import userManager from "src/services/authService"
import { Spinner } from "@/components/ui/spinner"

const LogoutPage = () => {
  useEffect(() => {
    userManager
      .signoutRedirectCallback()
      .then(() => {
        console.log("User signed out successfully")
        userManager.removeUser()
        window.location.href = "/"
      })
      .catch((error: any) => {
        console.error("Error during logout:", error)
        window.location.href = "/error"
      })
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-foreground">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Signing out...</p>
    </div>
  )
}

export default LogoutPage
