import React, { useEffect, useState } from 'react'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { useAuth } from 'src/authentication/useAuth'
import { useRouter } from 'next/router'
import invitationService from 'src/gendox-sdk/invitationService'
import { toast } from 'sonner'
import { getErrorMessage } from 'src/utils/errorHandler'
import { Progress } from '@/components/ui/progress'
import { routeTypes } from 'src/authentication/components/RouteHandler'

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
        console.error('Error handling OIDC redirect callback:', err)
        setLoading(false)
        setError(true)
        toast.error(`${getErrorMessage(err)}`)
      })
      .finally(() => {
        interval = setInterval(() => {
          setCounter((prevCounter) => {
            if (prevCounter <= 1) {
              router.replace('/')
              return 0
            }
            return prevCounter - 1
          })
        }, 1000)
      })

    return () => clearInterval(interval)
  }, [router.query])

  if (loading) {
    return <div className="h-1.5" />
  }

  return (
    <div>
      {error ? (
        <div>
          Something went wrong <br />
          redirect to home in {counter} seconds, or{' '}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              router.replace('/')
            }}
          >
            click here to go now
          </a>
        </div>
      ) : (
        <div>
          Success!<br />
          redirect to home in {counter} seconds, or{' '}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              router.replace('/')
            }}
          >
            click here to go now
          </a>
        </div>
      )}
    </div>
  )
}

AcceptInvitationPage.getLayout = (page: React.ReactNode) => <BlankLayout>{page}</BlankLayout>
AcceptInvitationPage.pageConfig = {
  routeType: routeTypes.sharedRoute,
}

export default AcceptInvitationPage
