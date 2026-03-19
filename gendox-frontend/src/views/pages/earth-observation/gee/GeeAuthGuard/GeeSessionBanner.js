import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Snackbar from '@mui/material/Snackbar'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { setSessionExpired } from 'src/store/earthObservation'

// Non-blocking session-expired banner.
// Shown when the GEE token expires mid-session (isGeeReady stays true,
// the workspace remains fully visible and interactive).
// The user reconnects with a single click — no page reload needed.
export default function GeeSessionBanner({ onReconnect }) {
  const dispatch = useDispatch()
  const sessionExpired = useSelector(s => s.earthObservation.map.sessionExpired)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState(false)

  if (!sessionExpired) return null

  const handleReconnect = async () => {
    setConnecting(true)
    setError(false)
    try {
      await onReconnect()
      // onReconnect resolves after auth + token persisted + timer rescheduled
      dispatch(setSessionExpired(false))
    } catch {
      setError(true)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Box open={true} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ top: { xs: 8, sm: 16 } }}>
      <Alert
        severity={error ? 'error' : 'warning'}
        variant='filled'
        sx={{ alignItems: 'center', width: '100%' }}
        action={
          <Button
            color='inherit'
            size='small'
            onClick={handleReconnect}
            disabled={connecting}
            startIcon={connecting ? <CircularProgress size={14} color='inherit' /> : null}
            sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}
          >
            {connecting ? 'Connecting...' : 'Reconnect'}
          </Button>
        }
      >
        {error ? 'Reconnect failed. Please try again.' : 'Google Earth Engine session expired — reconnect to continue'}
      </Alert>
    </Box>
  )
}
