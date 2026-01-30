import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setMapData, createEOScriptThunk } from 'src/store/earthObservation/earthObservation' 
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export default function GeeRunner({
  code,
  getCurrentCode,
  organizationId,
  projectId,
  taskId,
  token
}) {
  const dispatch = useDispatch()

  const { createEOScriptLoading, latestEOScriptLoading, geeOAuthToken } = useSelector(
    state => state.earthObservation
  )

  // 1. State για το iframe
  const [iframeKey, setIframeKey] = useState(0) //  counter for iframe reloads
  const [isRunning, setIsRunning] = useState(false)

  // 2. Refs for communication with iframe
  const pendingCodeRef = useRef(null)
  const iframeRef = useRef(null)
  const lastRunCodeRef = useRef('')

  // 3. O Handler for "Run Code" button
  const handleRun = () => {
    const currentCode = (getCurrentCode?.() ?? code ?? '').trim()
    if (!currentCode) return

    setIsRunning(true)
    dispatch(setMapData({ url: null })) // clear previous map

    // Keep the last run code (for save after SUCCESS)
    lastRunCodeRef.current = currentCode

    // Store the code we want to run in the iframe
    pendingCodeRef.current = currentCode

    // Increase the key -> React destroys the old iframe and creates a NEW one
    setIframeKey(prev => prev + 1)
  }

  // 4. Listen for messages (The heart of communication)
  useEffect(() => {
    const handleMessage = event => {
      // Ignore unrelated messages
      if (!event.data || !event.data.type) return

      const { type, payload, message } = event.data

      // A. The Iframe just born and is ready
      if (type === 'IFRAME_READY') {
        // If we have code pending, send it NOW
        if (pendingCodeRef.current && iframeRef.current) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: 'EXECUTE',
              code: pendingCodeRef.current,
              token: geeOAuthToken
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

      // B. Success - Map arrived
      if (type === 'SUCCESS') {
        dispatch(setMapData({ url: payload.url }))

        // Save the EOScript to backend (mirrors EditorPanel onRun)
        if (organizationId && projectId && taskId && token) {
          dispatch(
            createEOScriptThunk({
              organizationId,
              projectId,
              taskId,
              eoScriptPayload: {
                title: 'Latest GEE Script',
                description: 'Auto-saved from Editor Run',
                scriptContent: lastRunCodeRef.current
              },
              token
            })
          )
        }

        setIsRunning(false)
      }

      // C. Error
      if (type === 'ERROR') {
        console.error('GEE Script Error:', message)
        alert('Script Error: ' + message)
        setIsRunning(false)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [dispatch, geeOAuthToken, organizationId, projectId, taskId, token])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Button
        size='small'
        variant='contained'
        onClick={handleRun}
        disabled={isRunning || createEOScriptLoading || latestEOScriptLoading}
        startIcon={isRunning || createEOScriptLoading || latestEOScriptLoading ? <CircularProgress size={16} color='inherit' /> : null}
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
          // ADD ?v=4 AT THE END
          src='/gee-sandbox/gee-sandbox.html?v=4'
          sandbox='allow-scripts allow-same-origin'
          style={{ display: 'none' }}
        />
      )}
    </Box>
  )
}
