import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
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
    <div className='eo-banner' role='alert'>
      <TriangleAlert className='lucide' />
      <span style={{ flex: 1 }}>
        {error
          ? 'Reconnecting failed. Try again.'
          : 'Your Google Earth Engine session expired. Reconnect to run scripts and load map layers.'}
      </span>
      <button className='btn s' onClick={handleReconnect} disabled={connecting}>
        {connecting ? <LoaderCircle className='lucide turning' /> : <RefreshCw className='lucide' />}
        {connecting ? 'Connecting…' : 'Reconnect'}
      </button>
    </div>
  )
}
