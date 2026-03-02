import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { CheckCircle, AlertTriangle } from "lucide-react"
import BlankLayout from "src/@core/layouts/BlankLayout"
import { useAuth } from "src/authentication/useAuth"
import invitationService from "src/gendox-sdk/invitationService"
import { toast } from "sonner"
import { getErrorMessage } from "src/utils/errorHandler"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { routeTypes } from "src/authentication/components/RouteHandler"

const AcceptInvitationPage = () => {
  const auth = useAuth()
  const router = useRouter()
  const [counter, setCounter] = useState(3)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const { email, token } = router.query
    if (!email || !token) {
      return
    }

    let interval: ReturnType<typeof setInterval>
    invitationService
      .acceptInvitation(email, token)
      .then(() => {
        setLoading(false)
        setError(false)
      })
      .catch((err: any) => {
        console.error("Error handling invitation:", err)
        setLoading(false)
        setError(true)
        toast.error(`${getErrorMessage(err)}`)
      })
      .finally(() => {
        interval = setInterval(() => {
          setCounter((prevCounter) => {
            if (prevCounter <= 1) {
              router.replace("/")
              return 0
            }
            return prevCounter - 1
          })
        }, 1000)
      })

    return () => clearInterval(interval)
  }, [router.query])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-10 pb-10 px-8">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">
                Processing your invitation...
              </p>
            </div>
          ) : error ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-6">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Something Went Wrong</h2>
              <p className="text-sm text-muted-foreground mb-6">
                We couldn&apos;t process your invitation. Redirecting in{" "}
                {counter} seconds.
              </p>
              <Button variant="outline" onClick={() => router.replace("/")}>
                Go to Home
              </Button>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Invitation Accepted</h2>
              <p className="text-sm text-muted-foreground mb-6">
                You&apos;ve successfully joined. Redirecting in {counter}{" "}
                seconds.
              </p>
              <Button onClick={() => router.replace("/")}>Go to Home</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

AcceptInvitationPage.getLayout = (page: React.ReactNode) => (
  <BlankLayout>{page}</BlankLayout>
)
AcceptInvitationPage.pageConfig = {
  routeType: routeTypes.sharedRoute,
}

export default AcceptInvitationPage
