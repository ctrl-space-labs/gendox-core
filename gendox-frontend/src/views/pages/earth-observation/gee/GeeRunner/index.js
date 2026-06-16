import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearMapLayers,
  clearGeeExports,
  setMapThumbnail,
  setGeeRunError,
  clearScreenshotRequest,
  clearPrintMessages,
  clearMapResultScreenshot,
  selectEoGeometries
} from 'src/store/earthObservation'
import { runScriptRef, geeIframeRef } from 'src/views/pages/earth-observation/panels/shared/panelState'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useGeeExportPolling } from './useGeeExportPolling'
import { useGeeMessages } from './useGeeMessages'

export default function GeeRunner({
  code,
  getCurrentCode,
  organizationId,
  projectId,
  taskId,
  token,
  scriptName,
  isFirstScript
}) {
  const dispatch = useDispatch()

  const createEOScriptLoading = useSelector(state => state.earthObservation.scripts.createEOScriptLoading)
  const latestEOScriptLoading = useSelector(state => state.earthObservation.scripts.latestEOScriptLoading)
  const screenshotRequest = useSelector(state => state.earthObservation.map.screenshotRequest)
  const sessionExpired = useSelector(state => state.earthObservation.map.sessionExpired)
  const printMessages = useSelector(state => state.earthObservation.map.printMessages)
  const eoGeometries = useSelector(selectEoGeometries)

  const [iframeKey, setIframeKey] = useState(0) // incremented to destroy + recreate the iframe
  const [isRunning, setIsRunning] = useState(false)

  const pendingCodeRef = useRef(null)
  const pendingTokenRef = useRef(null)
  const pendingGeometriesRef = useRef([])
  const iframeRef = useRef(null)
  const lastRunCodeRef = useRef('')
  const scriptNameRef = useRef(scriptName)

  // Keep scriptNameRef in sync so the message handler never reads a stale name
  useEffect(() => {
    scriptNameRef.current = scriptName
  }, [scriptName])

  // Forward screenshot requests from MapPanel to the GEE sandbox iframe
  useEffect(() => {
    if (!screenshotRequest || !iframeRef.current) return
    iframeRef.current.contentWindow.postMessage({ type: 'GET_THUMB', payload: screenshotRequest }, '*')
    dispatch(clearScreenshotRequest())
  }, [screenshotRequest, dispatch])

  // Wire up all sandbox → parent message handling
  useGeeMessages({
    iframeRef,
    pendingCodeRef,
    pendingTokenRef,
    pendingGeometriesRef,
    scriptNameRef,
    lastRunCodeRef,
    organizationId,
    projectId,
    taskId,
    token,
    setIsRunning
  })

  useGeeExportPolling()

  const handleRun = () => {
    const currentCode = (getCurrentCode?.() ?? code ?? '').trim()
    if (!currentCode) return

    setIsRunning(true)
    dispatch(clearMapLayers())
    dispatch(clearGeeExports())
    dispatch(setMapThumbnail(null))
    dispatch(setGeeRunError(null))
    dispatch(clearPrintMessages())
    dispatch(clearMapResultScreenshot())

    lastRunCodeRef.current = currentCode
    // Read token fresh at click time — avoids using a stale token after silent refresh
    pendingTokenRef.current = window.localStorage.getItem('gee_access_token')
    pendingCodeRef.current = currentCode
    // Snapshot geometries at run time so the iframe receives what was drawn when Run was clicked
    pendingGeometriesRef.current = eoGeometries

    // Incrementing the key destroys the old iframe and mounts a fresh one
    setIframeKey(prev => prev + 1)
  }

  // Expose handleRun via a shared ref so EditorPanel tool handlers can trigger
  // a run without prop drilling (same pattern as editorCodeRef)
  useEffect(() => {
    runScriptRef.current = handleRun
    return () => {
      runScriptRef.current = null
    }
  })

  useEffect(() => {
    const el = iframeRef.current
    geeIframeRef.current = el
    return () => {
      if (geeIframeRef.current === el) geeIframeRef.current = null
    }
  }, [iframeKey])

  const isLoading = isRunning || createEOScriptLoading || latestEOScriptLoading

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Button
        size='small'
        variant='contained'
        onClick={handleRun}
        disabled={isFirstScript || isLoading || sessionExpired}
        startIcon={isLoading ? <CircularProgress size={16} color='inherit' /> : null}
      >
        {isLoading ? 'Processing...' : 'Run Code'}
      </Button>

      {/* key={iframeKey}: each increment destroys the old iframe and creates a new one.
          iframeKey === 0 means no run has happened yet — skip rendering entirely. */}
      {iframeKey > 0 && (
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src='/gee-sandbox/gee-sandbox.html'
          sandbox='allow-scripts allow-modals'
          style={{ display: 'none' }}
        />
      )}
    </Box>
  )
}
