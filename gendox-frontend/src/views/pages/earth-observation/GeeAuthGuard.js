import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ee from '@google/earthengine'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

import { setGeeReady } from 'src/store/earthObservation/earthObservation'
import commonConfig from 'src/configs/common.config.js'

const CLIENT_ID = commonConfig.GEE_clientId

export default function GeeAuthGuard({ children }) {
  const dispatch = useDispatch()
  const isGeeReady = useSelector(s => s.earthObservation.isGeeReady)

  const [loading, setLoading] = useState(!isGeeReady)
  const [error, setError] = useState(null)

  // Ref to avoid multiple init attempts
  const initAttempted = useRef(false)

  // 1. The Initialize function (called AFTER we have an auth token)
  const runInitialize = () => {
    ee.initialize(
      null,
      null,
      () => {
        console.log('GEE Initialized Successfully')
        dispatch(setGeeReady(true))
        setLoading(false)
      },
      err => {
        console.warn('GEE Init failed (token might be expired).', err)
        setLoading(false) // Stop loading so the user can see the Login
      }
    )
  }

  useEffect(() => {
    // If already ready, do nothing
    if (isGeeReady) {
      setLoading(false)
      return
    }

    if (initAttempted.current) return
    initAttempted.current = true

    // --- SAFETY TIMEOUT ---
    // If GEE takes more than 3 seconds to respond, show the Login
    const safetyTimer = setTimeout(() => {
      setLoading(currentLoading => {
        if (currentLoading) {
          console.log('GEE check timed out. Showing login button.')
          return false
        }
        return currentLoading
      })
    }, 3000)

    // (If there is already a cookie from a previous login, this will work)
    try {
      runInitialize()
    } catch (e) {
      console.log('Auto-init crashed, showing login.')
      setLoading(false)
    }

    return () => clearTimeout(safetyTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeeReady])

  // 2. Login Handler
  const handleLoginClick = () => {
    setLoading(true)
    setError(null)

    // Using Oauth which accepts CLIENT_ID as the first parameter
    ee.data.authenticateViaOauth(
      CLIENT_ID,
      authResult => {
        console.log('Auth Success:', authResult)
        // After successful login, initialize
        runInitialize()
      },
      err => {
        console.error('Auth Failed', err)
        setError('Authentication failed. Please try again.')
        setLoading(false)
      },
      null,
      () => {
        // If the popup is closed without login
        setLoading(false)
      }
    )
  }

  // --- RENDER ---

  if (isGeeReady) {
    return <>{children}</>
  }

  return (
    <>
      <Box
        sx={{
          height: '100vh',
          width: '100%',
          bgcolor: 'background.default',
          filter: 'blur(5px)',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 0
        }}
      />

      <Dialog open={true} disableEscapeKeyDown fullWidth maxWidth='xs' PaperProps={{ sx: { zIndex: 9999 } }}>
        <DialogTitle sx={{ textAlign: 'center' }}>Earth Engine Connection</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
            {loading ? (
              <>
                <CircularProgress />
                <Typography>Connecting to Earth Engine...</Typography>
              </>
            ) : (
              <>
                <Typography align='center' color='text.secondary'>
                  To use this workspace, please sign in with your Google Earth Engine account.
                </Typography>
                {error && (
                  <Typography color='error' variant='caption' sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </DialogContent>

        {!loading && (
          <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
            <Button variant='contained' onClick={handleLoginClick} size='large'>
              Sign in with Google
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  )
}
