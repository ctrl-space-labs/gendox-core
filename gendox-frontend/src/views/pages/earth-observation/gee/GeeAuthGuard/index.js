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

import { setGeeReady, setSessionExpired } from 'src/store/earthObservation'
import { readStoredToken, persistToken, clearStoredToken } from './geeStorage'
import { CLIENT_ID, authenticateViaOauth } from './geeOAuth'

const REFRESH_BUFFER_MS = 10 * 1000 // refresh 10 seconds before expiry

// reconnectRef — optional ref owned by a parent component (e.g. EarthObservationWorkspacePage).
// GeeAuthGuard writes its handleReconnect function into it so the parent can
// render GeeSessionBanner outside this component's subtree (e.g. above GlassSurface).
export default function GeeAuthGuard({ children, reconnectRef }) {
  const dispatch = useDispatch()
  const isGeeReady = useSelector(s => s.earthObservation.map.isGeeReady)

  const [loading, setLoading] = useState(!isGeeReady)
  const [error, setError] = useState(null)

  const initAttempted = useRef(false)
  const refreshTimerRef = useRef(null)

  // Cancel the background timer when the component unmounts
  useEffect(
    () => () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    },
    []
  )

  // ── Session expiry timer ──────────────────────────────────────────────────
  // Fires before the token expires and marks the session as expired so the
  // non-blocking banner appears. We intentionally do NOT attempt re-auth here:
  // browsers block popups from timer callbacks (not a user gesture). The popup
  // is only opened when the user clicks "Reconnect" in the banner.
  const scheduleTokenRefresh = expiresInSeconds => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const delayMs = Math.max(0, expiresInSeconds * 1000 - REFRESH_BUFFER_MS)

    refreshTimerRef.current = setTimeout(() => {
      clearStoredToken()
      dispatch(setSessionExpired(true))
    }, delayMs)
  }

  // ─────────────────────────────────────────────────────────────────────────

  // Helper: read the current EE token, persist it, and start the refresh timer
  const persistAndSchedule = () => {
    try {
      const tok = ee.data.getAuthToken()
      if (tok) {
        const tokenStr = typeof tok === 'object' ? tok.access_token : String(tok).replace(/^Bearer /, '')
        const expiresIn = typeof tok === 'object' ? tok.expires_in || 3600 : 3600
        if (tokenStr) {
          persistToken(tokenStr, expiresIn)
          scheduleTokenRefresh(expiresIn)
        }
      }
    } catch {}
  }

  // ── On mount: try silent restore from stored access token ─────────────────
  // Optimisation: if a valid token is stored, reuse it to skip the popup.
  // If EE init fails (token expired), clear storage and show the login dialog.
  useEffect(() => {
    if (isGeeReady) {
      setLoading(false)
      return
    }
    if (initAttempted.current) return
    initAttempted.current = true

    const stored = readStoredToken()

    if (stored) {
      ee.data.setAuthToken(CLIENT_ID, 'Bearer', stored.token, stored.expiresIn, [], null, false)
      ee.initialize(
        null,
        null,
        () => {
          scheduleTokenRefresh(stored.expiresIn)
          dispatch(setGeeReady(true))
          setLoading(false)
        },
        () => {
          clearStoredToken()
          setLoading(false)
        }
      )
      return
    }

    // No stored token — show login dialog
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeeReady])

  // ── Reconnect handler ─────────────────────────────────────────────────────
  // Called when the user clicks "Reconnect" in the Snackbar.
  // Auth-only — no ee.initialize needed (EE is already initialised).
  const handleReconnect = () =>
    authenticateViaOauth().then(() => {
      persistAndSchedule()
    })

  // Expose handleReconnect to parent via ref (for GeeSessionBanner rendered outside this subtree)
  useEffect(() => {
    if (reconnectRef) reconnectRef.current = handleReconnect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })

  // ── First-time login handler ───────────────────────────────────────────────
  const handleLoginClick = () => {
    setLoading(true)
    setError(null)

    authenticateViaOauth()
      .then(
        () =>
          new Promise((resolve, reject) => {
            ee.initialize(null, null, resolve, reject)
          })
      )
      .then(() => {
        persistAndSchedule()
        dispatch(setGeeReady(true))
        setLoading(false)
      })
      .catch(err => {
        console.error('GEE Auth Failed', err)
        setError('Authentication failed. Please try again.')
        setLoading(false)
      })
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Workspace is ready: render children only ──────────────────────────────
  // GeeSessionBanner is rendered by the parent (EarthObservationWorkspacePage)
  // outside GlassSurface, using the reconnectRef to call handleReconnect.
  if (isGeeReady) {
    return <>{children}</>
  }

  // ── First-time login: blocking dialog (no token ever existed) ─────────────
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
