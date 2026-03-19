import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setMapData,
  addMapLayer,
  clearMapLayers,
  setMapThumbnail,
  setScreenshotUrl,
  setGeeRunError,
  appendPrintMessage,
  clearPrintMessages,
  createEOScriptThunk,
  clearScreenshotRequest
} from 'src/store/earthObservation'
import { runScriptRef } from 'src/views/pages/earth-observation/panels/shared/panelState'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export default function GeeRunner({ code, getCurrentCode, organizationId, projectId, taskId, token, scriptName, isFirstScript }) {
  const dispatch = useDispatch()

  const createEOScriptLoading = useSelector(state => state.earthObservation.scripts.createEOScriptLoading)
  const latestEOScriptLoading = useSelector(state => state.earthObservation.scripts.latestEOScriptLoading)
  const screenshotRequest = useSelector(state => state.earthObservation.map.screenshotRequest)
  const printMessages = useSelector(state => state.earthObservation.map.printMessages)

  // 1. State for iframe management
  const [iframeKey, setIframeKey] = useState(0) //  counter for iframe reloads
  const [isRunning, setIsRunning] = useState(false)

  // 2. Refs for communication with iframe
  const pendingCodeRef = useRef(null)
  const pendingTokenRef = useRef(null)
  const iframeRef = useRef(null)
  const lastRunCodeRef = useRef('')
  const scriptNameRef = useRef(scriptName)

  // Keep scriptNameRef in sync with the prop (avoids stale closure in handleMessage)
  useEffect(() => {
    scriptNameRef.current = scriptName
  }, [scriptName])

  // Forward screenshot requests from MapPanel to the GEE sandbox iframe
  useEffect(() => {
    if (!screenshotRequest || !iframeRef.current) return
    iframeRef.current.contentWindow.postMessage({ type: 'GET_THUMB', payload: screenshotRequest }, '*')
    dispatch(clearScreenshotRequest())
  }, [screenshotRequest, dispatch])

  // 3. Handler for "Run Code" button
  const handleRun = () => {
    const currentCode = (getCurrentCode?.() ?? code ?? '').trim()
    if (!currentCode) return

    setIsRunning(true)
    dispatch(clearMapLayers()) // clear previous map layers
    dispatch(setMapThumbnail(null)) // clear previous thumbnail
    dispatch(setGeeRunError(null)) // clear previous error
    dispatch(clearPrintMessages()) // clear previous print output

    // Keep the last run code (for save after SUCCESS)
    lastRunCodeRef.current = currentCode

    // Read the GEE token fresh at click time so the useEffect closure never
    // uses a stale token (e.g. after a silent token refresh).
    pendingTokenRef.current = window.localStorage.getItem('gee_access_token')

    // Store the code we want to run in the iframe
    pendingCodeRef.current = currentCode

    // Increase the key -> React destroys the old iframe and creates a NEW one
    setIframeKey(prev => prev + 1)
  }

  // Keep runScriptRef current so EditorPanel's tool handler can trigger a run
  // without prop drilling — same pattern as editorCodeRef.
  useEffect(() => {
    runScriptRef.current = handleRun
    return () => {
      runScriptRef.current = null
    }
  })

  // 4. Listen for messages (The heart of communication)
  useEffect(() => {
    const handleMessage = event => {
      // Ignore unrelated messages
      if (!event.data || !event.data.type) return
      // Sandboxed iframes without allow-same-origin have a null origin, so we
      // check event.source instead of event.origin to verify the message comes
      // from our specific iframe instance and not another window.
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return

      const { type, payload, message } = event.data

      // A. The Iframe just born and is ready
      if (type === 'IFRAME_READY') {
        // If we have code pending, send it NOW
        if (pendingCodeRef.current && iframeRef.current) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: 'EXECUTE',
              code: pendingCodeRef.current,
              token: pendingTokenRef.current
            },
            '*'
          )

          // clear pending code
          pendingCodeRef.current = null
        }
      }

      // A. Update map center
      if (type === 'CENTER') {
        dispatch(setMapData({ center: payload?.center }))
      }

      // B. Success - Map layer arrived
      if (type === 'SUCCESS') {
        if (payload.url) {
          dispatch(addMapLayer({ url: payload.url, name: payload.name || 'Layer' }))
        }

        // Save the EOScript to backend (mirrors EditorPanel onRun)
        if (organizationId && projectId && taskId && token) {
          dispatch(
            createEOScriptThunk({
              organizationId,
              projectId,
              taskId,
              eoScriptPayload: {
                title: scriptNameRef.current || 'My Script',
                description: (() => {
                  const d = new Date()
                  const pad = n => String(n).padStart(2, '0')
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                  return `Run-Saved – ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${pad(
                    d.getHours()
                  )}:${pad(d.getMinutes())}`
                })(),
                scriptContent: lastRunCodeRef.current
              },
              token
            })
          )
        }

        setIsRunning(false)
      }

      // C. Auto-thumbnail after script run (from Map.setCenter region)
      if (type === 'THUMBNAIL') {
        const thumbUrl = payload?.url
        if (!thumbUrl) return

        const geeToken = window.localStorage.getItem('gee_access_token')
        if (!geeToken) return

        fetch(thumbUrl, { headers: { Authorization: 'Bearer ' + geeToken } })
          .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status)
            return res.blob()
          })
          .then(
            blob =>
              new Promise(resolve => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.readAsDataURL(blob)
              })
          )
          .then(dataUrl => dispatch(setMapThumbnail(dataUrl)))
          .catch(err => console.warn('GEE thumbnail fetch failed:', err))
      }

      // C2. On-demand screenshot from the camera button (current viewport bounds)
      if (type === 'SCREENSHOT') {
        const thumbUrl = payload?.url
        if (!thumbUrl) return

        const geeToken = window.localStorage.getItem('gee_access_token')
        if (!geeToken) return

        fetch(thumbUrl, { headers: { Authorization: 'Bearer ' + geeToken } })
          .then(res => {
            if (!res.ok) throw new Error('HTTP ' + res.status)
            return res.blob()
          })
          .then(
            blob =>
              new Promise(resolve => {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.readAsDataURL(blob)
              })
          )
          .then(dataUrl => dispatch(setScreenshotUrl(dataUrl)))
          .catch(err => console.warn('GEE screenshot fetch failed:', err))
      }

      // D. Error
      if (type === 'ERROR') {
        console.error('GEE Script Error:', message)
        dispatch(setGeeRunError(message))
        setIsRunning(false)
      }

      // E. print() output from user script
      if (type === 'PRINT') {
        dispatch(appendPrintMessage(payload?.message ?? ''))
      }

      // F. Map.setZoom() — update stored center zoom
      if (type === 'ZOOM') {
        dispatch(setMapData({ zoom: payload?.zoom }))
      }

      // G. Map.clear() — remove all layers
      if (type === 'CLEAR_LAYERS') {
        dispatch(clearMapLayers())
      }

      // H. Map.setOptions() — basemap style hint (no-op on OSM, logged for visibility)
      if (type === 'MAP_OPTIONS') {
        console.log('GEE Map.setOptions (ignored on OSM):', payload)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [dispatch, organizationId, projectId, taskId, token])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Button
        size='small'
        variant='contained'
        onClick={handleRun}
        disabled={isFirstScript || isRunning || createEOScriptLoading || latestEOScriptLoading}
        startIcon={
          isRunning || createEOScriptLoading || latestEOScriptLoading ? (
            <CircularProgress size={16} color='inherit' />
          ) : null
        }
      >
        {isRunning || createEOScriptLoading || latestEOScriptLoading ? 'Processing...' : 'Run Code'}
      </Button>

      {/* The Iframe.
         - key={iframeKey}: Each time it changes, the iframe is destroyed & recreated.
         - If iframeKey is 0 (initial state), we don't load it at all (optional).
      */}
      {iframeKey > 0 && (
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src='/gee-sandbox/gee-sandbox.html'
          sandbox='allow-scripts'
          style={{ display: 'none' }}
        />
      )}
    </Box>
  )
}
