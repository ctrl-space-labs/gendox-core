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

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_TOKEN = 'gee_access_token'
const LS_EXPIRY = 'gee_token_expiry'
const EXPIRY_BUFFER_MS = 5 * 60 * 1000 // treat token as expired 5 min early

function readStoredToken() {
  try {
    const token = window.localStorage.getItem(LS_TOKEN)
    const expiry = Number(window.localStorage.getItem(LS_EXPIRY) || 0)
    if (!token || Date.now() >= expiry - EXPIRY_BUFFER_MS) return null
    return {
      token,
      expiresIn: Math.max(60, Math.floor((expiry - Date.now()) / 1000))
    }
  } catch {
    return null
  }
}

function persistToken(accessToken, expiresIn) {
  try {
    window.localStorage.setItem(LS_TOKEN, accessToken)
    window.localStorage.setItem(LS_EXPIRY, String(Date.now() + expiresIn * 1000))
  } catch {}
}

function clearStoredToken() {
  try {
    window.localStorage.removeItem(LS_TOKEN)
    window.localStorage.removeItem(LS_EXPIRY)
  } catch {}
}
// ─────────────────────────────────────────────────────────────────────────────

export default function GeeAuthGuard({ children }) {
  const dispatch = useDispatch()
  const isGeeReady = useSelector(s => s.earthObservation.isGeeReady)

  const [loading, setLoading] = useState(!isGeeReady)
  const [error, setError] = useState(null)

  const initAttempted = useRef(false)

  // Called after auth is in place — initializes the EE library
  const runInitialize = () => {
    ee.initialize(
      null,
      null,
      () => {
        // Read the token back from the EE library (reliable regardless of auth path)
        // and persist it so the next page refresh is silent
        try {
          const tok = ee.data.getAuthToken()
          if (tok) {
            const tokenStr =
              typeof tok === 'object' ? tok.access_token : String(tok).replace(/^Bearer /, '')
            const expiresIn = typeof tok === 'object' && tok.expires_in ? tok.expires_in : 3600
            if (tokenStr) persistToken(tokenStr, expiresIn)
          }
        } catch {}

        dispatch(setGeeReady(true))
        setLoading(false)
      },
      err => {
        console.warn('GEE Init failed (token might be expired).', err)
        clearStoredToken() // wipe stale token so next visit shows login
        setLoading(false)
      }
    )
  }

  useEffect(() => {
    if (isGeeReady) {
      setLoading(false)
      return
    }

    if (initAttempted.current) return
    initAttempted.current = true

    const stored = readStoredToken()

    if (stored) {
      // ── Silent restore path ────────────────────────────────────────────────
      // Inject the persisted token into the EE library, then initialize.
      // No dialog shown — user won't notice the refresh.
      ee.data.setAuthToken(
        CLIENT_ID,
        'Bearer',
        stored.token,
        stored.expiresIn,
        [],   // extra scopes
        null, // no callback needed — setAuthToken is synchronous
        false // don't update gapi.auth (not loaded in this app)
      )
      runInitialize()
      return
    }

    // ── No stored token — try silent init (browser cookie path) ───────────
    // Safety timeout: if EE takes >3 s without responding, show the login button.
    const safetyTimer = setTimeout(() => {
      setLoading(prev => (prev ? false : prev))
    }, 3000)

    try {
      runInitialize()
    } catch {
      console.log('Auto-init crashed, showing login.')
      setLoading(false)
    }

    return () => clearTimeout(safetyTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeeReady])

  // Login button handler
  const handleLoginClick = () => {
    setLoading(true)
    setError(null)

    ee.data.authenticateViaOauth(
      CLIENT_ID,
      () => {
        // Token is persisted inside runInitialize's success callback via ee.data.getAuthToken()
        runInitialize()
      },
      err => {
        console.error('Auth Failed', err)
        setError('Authentication failed. Please try again.')
        setLoading(false)
      },
      null,
      () => {
        setLoading(false) // popup closed without login
      }
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
