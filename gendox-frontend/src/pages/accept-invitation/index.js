import React, { useContext, useEffect, useState } from 'react'
import BlankLayout from 'src/@core/layouts/BlankLayout'
import { useAuth } from 'src/authentication/useAuth'
import { useRouter } from 'next/router'
import invitationService from 'src/gendox-sdk/invitationService' // Ensure you have the correct path to your OIDC UserManager setup
import toast from 'react-hot-toast'
import { getErrorMessage } from 'src/utils/errorHandler'
import { LinearProgress } from '@mui/material'
import {routeTypes} from "../../authentication/components/RouteHandler";

const AcceptInvitationPage = () => {
  const auth = useAuth()
  const router = useRouter()
  const [counter, setCounter] = useState(3)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    // Get email and token from URL params
    const { email, token } = router.query
    if (!email || !token) {
      return
    }

    let interval
    invitationService
      .acceptInvitation(email, token)
      .then(() => {
        setLoading(false)
        setError(false)
      })
      .catch(error => {
        console.error('Error handling OIDC redirect callback:', error)
        setLoading(false)
        setError(true)
        toast.error(`${getErrorMessage(error)}`)
      })
      .finally(() => {
        // Countdown timer for redirection
        interval = setInterval(() => {
          setCounter(prevCounter => {
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
    // return <div>Loading...</div>; // Display a loading message while processing the callback
    <LinearProgress
      color='primary'
      sx={{
        height: 6, // Slightly thinner for a sleeker look
        borderRadius: 1, // Adds rounded corners
        mb: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.1)' // Subtle background for contrast
      }}
    />
  }

  return (
    <div>
      {error ? (
        <div>
          Something went wrong <br></br>
          redirect to home in {counter} seconds, or{' '}
          <a
            href='/'
            onClick={e => {
              e.preventDefault()
              router.replace('/')
            }}
          >
            click here to go now
          </a>
        </div>
      ) : (
        <div>
          Success!<br></br>
          redirect to home in {counter} seconds, or{' '}
          <a
            href='/'
            onClick={e => {
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

AcceptInvitationPage.getLayout = page => <BlankLayout>{page}</BlankLayout>
// Allow both authenticated and unauthenticated users to access the page
AcceptInvitationPage.pageConfig = {
  routeType: routeTypes.sharedRoute
}
export default AcceptInvitationPage
