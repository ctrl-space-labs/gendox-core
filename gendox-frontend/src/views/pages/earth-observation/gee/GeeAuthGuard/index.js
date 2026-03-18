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

import { setGeeReady } from 'src/store/earthObservation'
import {
  readStoredToken, persistToken, persistRefreshToken,
  readRefreshToken, clearStoredToken, EXPIRY_BUFFER_MS
} from './geeStorage'
import { generateCodeVerifier, generateCodeChallenge } from './geePkce'
import { CLIENT_ID, openAuthPopup, exchangeCodeForTokens, doTokenRefresh } from './geeOAuth'

export default function GeeAuthGuard({ children }) {
  const dispatch   = useDispatch()
  const isGeeReady = useSelector(s => s.earthObservation.map.isGeeReady)

  const [loading, setLoading] = useState(!isGeeReady)
  const [error,   setError]   = useState(null)

  const initAttempted          = useRef(false)
  const refreshTimerRef        = useRef(null)
  const scheduleTokenRefreshRef = useRef(null)

  // Clear the background refresh timer when the component unmounts
  useEffect(() => () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current) }, [])

  // ── Background silent refresh via refresh token ───────────────────────────
  const handleSilentRefreshFail = () => {
    console.warn('[GEE] Silent refresh failed — showing login dialog')
    clearStoredToken()
    dispatch(setGeeReady(false))
    setLoading(false)
  }

  const scheduleTokenRefresh = expiresInSeconds => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const delayMs = Math.max(0, expiresInSeconds * 1000 - EXPIRY_BUFFER_MS)

    refreshTimerRef.current = setTimeout(async () => {
      const refreshToken = readRefreshToken()
      if (!refreshToken) { handleSilentRefreshFail(); return }

      try {
        const data      = await doTokenRefresh(refreshToken)
        const expiresIn = data.expires_in || 3600
        persistToken(data.access_token, expiresIn)
        ee.data.setAuthToken(CLIENT_ID, 'Bearer', data.access_token, expiresIn, [], null, false)
        scheduleTokenRefreshRef.current?.(expiresIn)
      } catch {
        handleSilentRefreshFail()
      }
    }, delayMs)
  }

  // Keep ref in sync to avoid stale closures inside the async timer callback
  scheduleTokenRefreshRef.current = scheduleTokenRefresh
  // ──────────────────────────────────────────────────────────────────────────

  // Called once the auth token is set in the EE library — initializes EE
  const runInitialize = () => {
    ee.initialize(
      null,
      null,
      () => {
        try {
          const tok = ee.data.getAuthToken()
          if (tok) {
            const tokenStr = typeof tok === 'object' ? tok.access_token : String(tok).replace(/^Bearer /, '')
            const expiresIn = typeof tok === 'object' && tok.expires_in ? tok.expires_in : 3600
            if (tokenStr) {
              persistToken(tokenStr, expiresIn)
              scheduleTokenRefresh(expiresIn)
            }
          }
        } catch {}
        dispatch(setGeeReady(true))
        setLoading(false)
      },
      err => {
        console.warn('GEE Init failed (token might be expired).', err)
        clearStoredToken()
        setLoading(false)
      }
    )
  }

  useEffect(() => {
    if (isGeeReady) { setLoading(false); return }
    if (initAttempted.current) return
    initAttempted.current = true

    const stored = readStoredToken()

    if (stored) {
      // ── Silent restore path ──────────────────────────────────────────────
      ee.data.setAuthToken(CLIENT_ID, 'Bearer', stored.token, stored.expiresIn, [], null, false)
      scheduleTokenRefresh(stored.expiresIn)
      runInitialize()
      return
    }

    // ── No stored token — show login dialog ──────────────────────────────
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

  // ── Login handler — PKCE Authorization Code flow ──────────────────────────
  const handleLoginClick = async () => {
    setLoading(true)
    setError(null)

    try {
      const verifier  = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)
      const code      = await openAuthPopup(challenge)
      const tokens    = await exchangeCodeForTokens(code, verifier)

      persistToken(tokens.access_token, tokens.expires_in || 3600)
      if (tokens.refresh_token) persistRefreshToken(tokens.refresh_token)

      ee.data.setAuthToken(CLIENT_ID, 'Bearer', tokens.access_token, tokens.expires_in || 3600, [], null, false)
      runInitialize()
    } catch (err) {
      console.error('GEE Auth Failed', err)
      setError('Authentication failed. Please try again.')
      setLoading(false)
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Render ────────────────────────────────────────────────────────────────
  if (isGeeReady) return <>{children}</>

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
