import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ee from '@google/earthengine'

import Link from 'next/link'
import { Earth, LogIn } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import Spinner from 'src/components/ui/Spinner'

import {
  setGeeReady,
  setGeeUserEmail,
  setGeeProjectFallbackActive,
  setSessionExpired
} from 'src/store/earthObservation'
import { fetchOrganizationConnectors } from 'src/store/activeOrganization/activeOrganization'
import { CONNECTOR_TYPES } from 'src/gendox-sdk/organizationConnectorService'
import { localStorageConstants } from 'src/utils/generalConstants'
import { readStoredToken, persistToken, clearStoredToken } from './geeStorage'
import { CLIENT_ID, authenticateViaOauth, fetchGeeUserEmail, initializeEarthEngineWithFallback } from './geeOAuth'

const REFRESH_BUFFER_MS = 10 * 1000 // refresh 10 seconds before expiry

// reconnectRef — optional ref owned by a parent component (e.g. EarthObservationWorkspacePage).
// GeeAuthGuard writes its handleReconnect function into it so the parent can
// render GeeSessionBanner outside this component's subtree (e.g. above GlassSurface).
export default function GeeAuthGuard({ children, reconnectRef }) {
  const dispatch = useDispatch()
  const isGeeReady = useSelector(s => s.earthObservation.map.isGeeReady)
  const { organizationId, href } = useActiveScope()
  const connectors = useSelector(s => s.activeOrganization.organizationConnectors)
  // null = still loading; [] or array = loaded. We gate EE init on this so the
  // configured project ID (if any) is passed to ee.initialize as opt_project.
  const geeProjectId =
    (connectors || []).find(c => c.connectorType === CONNECTOR_TYPES.GOOGLE_EARTH_ENGINE)?.config?.projectId || null

  const [loading, setLoading] = useState(!isGeeReady)
  const [error, setError] = useState(null)

  const initAttempted = useRef(false)
  const refreshTimerRef = useRef(null)

  // Make sure the organization's connectors are loaded before we decide whether
  // to pass opt_project to ee.initialize.
  useEffect(() => {
    if (!organizationId) return
    const token =
      typeof window !== 'undefined' ? window.localStorage.getItem(localStorageConstants.accessTokenKey) : null
    if (!token) return
    dispatch(fetchOrganizationConnectors({ organizationId, token }))
  }, [organizationId, dispatch])

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

  // Helper: resolve the Google account email behind the access token and push it
  // into Redux so the EO header chip can show which Google user is connected.
  // Silently no-ops on failure — the header just keeps its placeholder.
  const resolveAndStoreUserEmail = accessToken => {
    if (!accessToken) return
    fetchGeeUserEmail(accessToken).then(email => {
      if (email) dispatch(setGeeUserEmail(email))
    })
  }

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
          resolveAndStoreUserEmail(tokenStr)
        }
      }
    } catch {}
  }

  // ── On mount: try silent restore from stored access token ─────────────────
  // Optimisation: if a valid token is stored, reuse it to skip the popup.
  // If EE init fails (token expired), clear storage and show the login dialog.
  // We wait until connectors are loaded (null → array) so the optional
  // organization-level GEE project ID is passed to ee.initialize as opt_project.
  useEffect(() => {
    if (isGeeReady) {
      setLoading(false)
      return
    }
    if (initAttempted.current) return
    if (connectors === null) return
    initAttempted.current = true

    const stored = readStoredToken()

    if (stored) {
      ee.data.setAuthToken(CLIENT_ID, 'Bearer', stored.token, stored.expiresIn, [], null, false)
      initializeEarthEngineWithFallback(geeProjectId, stored.token)
        .then(({ projectFailed }) => {
          scheduleTokenRefresh(stored.expiresIn)
          dispatch(setGeeProjectFallbackActive(projectFailed))
          dispatch(setGeeReady(true))
          resolveAndStoreUserEmail(stored.token)
          setLoading(false)
        })
        .catch(() => {
          clearStoredToken()
          setLoading(false)
        })
      return
    }

    // No stored token — show login dialog
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGeeReady, connectors])

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
      .then(() => {
        // Read the access token EE just stored, so the probe in
        // initializeEarthEngineWithFallback can authenticate its HTTP call.
        const tok = ee.data.getAuthToken()
        const accessToken =
          typeof tok === 'object' ? tok?.access_token : String(tok || '').replace(/^Bearer /, '')
        return initializeEarthEngineWithFallback(geeProjectId, accessToken)
      })
      .then(({ projectFailed }) => {
        console.log('[LOGIN] dispatching fallback=', projectFailed)
        persistAndSchedule()
        dispatch(setGeeProjectFallbackActive(projectFailed))
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

  // ── First-time login: a gate over the workspace (no token ever existed) ──
  return (
    <div className='gate'>
      <div className='modal s' role='dialog' aria-modal='true' style={{ padding: 28, textAlign: 'center', alignItems: 'center', gap: 12 }}>
        <span className='avatar l' style={{ '--h': 210 }}>
          <Earth className='lucide' />
        </span>
        <h2>Connect Google Earth Engine</h2>
        {loading ? (
          <>
            <Spinner />
            <p className='muted'>Connecting to Earth Engine…</p>
          </>
        ) : (
          <>
            <p className='muted'>
              This workspace runs your scripts on Earth Engine with your Google account. It’s separate from your Gendox
              sign-in.
            </p>
            {error && (
              <p className='sm' style={{ color: 'var(--err)' }}>
                {error}
              </p>
            )}
            <button className='btn primary' onClick={handleLoginClick}>
              <LogIn className='lucide' />
              Sign in with Google
            </button>
            <Link className='link sm' href={href('/gendox/connectors')}>
              Earth Engine settings
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
