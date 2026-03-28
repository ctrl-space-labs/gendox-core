import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  setMapData,
  addMapLayer,
  clearMapLayers,
  setMapThumbnail,
  setScreenshotUrl,
  setGeeRunError,
  appendPrintMessage,
  upsertGeeExport,
  applyEeOperationResult,
  createEOScriptThunk
} from 'src/store/earthObservation'
import { buildSubmittedGeeExportPayload } from 'src/store/earthObservation/geeExportPayload'
import { fetchGeeImage } from './fetchGeeImage'

// Handles all window.message events coming from the GEE sandbox iframe.
// Extracted here so GeeRunner/index.js stays focused on the run button + iframe rendering.
export function useGeeMessages({
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
}) {
  const dispatch = useDispatch()

  useEffect(() => {
    const handleMessage = event => {
      if (!event.data || !event.data.type) return
      // Sandboxed iframes without allow-same-origin have a null origin, so we
      // check event.source instead of event.origin to verify the message comes
      // from our specific iframe instance and not another window.
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return

      const { type, payload, message } = event.data

      // The iframe just loaded and is ready to receive code
      if (type === 'IFRAME_READY') {
        if (pendingCodeRef.current && iframeRef.current) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: 'EXECUTE',
              code: pendingCodeRef.current,
              token: pendingTokenRef.current,
              geometries: pendingGeometriesRef?.current ?? []
            },
            '*'
          )
          pendingCodeRef.current = null
        }
      }

      // Map center update
      if (type === 'CENTER') {
        dispatch(setMapData({ center: payload?.center }))
      }

      // Script ran successfully — add map layer and save the script to backend
      if (type === 'SUCCESS') {
        if (payload.url) {
          dispatch(addMapLayer({ url: payload.url, name: payload.name || 'Layer' }))
        }

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
                  return `Run-Saved – ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
                })(),
                scriptContent: lastRunCodeRef.current
              },
              token
            })
          )
        }

        setIsRunning(false)
      }

      // Auto-thumbnail generated after Map.setCenter (used as task preview image)
      if (type === 'THUMBNAIL') {
        if (payload?.url) {
          fetchGeeImage(payload.url)
            .then(dataUrl => dataUrl && dispatch(setMapThumbnail(dataUrl)))
            .catch(err => console.warn('GEE thumbnail fetch failed:', err))
        }
      }

      // On-demand screenshot from the camera button (current viewport bounds)
      if (type === 'SCREENSHOT') {
        if (payload?.url) {
          fetchGeeImage(payload.url)
            .then(dataUrl => dataUrl && dispatch(setScreenshotUrl(dataUrl)))
            .catch(err => console.warn('GEE screenshot fetch failed:', err))
        }
      }

      // Script error
      if (type === 'ERROR') {
        console.error('GEE Script Error:', message)
        dispatch(setGeeRunError(message))
        setIsRunning(false)
      }

      // print() output from user script
      if (type === 'PRINT') {
        dispatch(appendPrintMessage(payload?.message ?? ''))
      }

      // Map.setZoom() — update stored center zoom
      if (type === 'ZOOM') {
        dispatch(setMapData({ zoom: payload?.zoom }))
      }

      // Map.clear() — remove all layers
      if (type === 'CLEAR_LAYERS') {
        dispatch(clearMapLayers())
      }

      // Map.setOptions() — basemap style hint (no-op on OSM, logged for visibility)
      if (type === 'MAP_OPTIONS') {
        console.log('GEE Map.setOptions (ignored on OSM):', payload)
      }

      if (type === 'EXPORT_STARTED' && payload?.taskId) {
        const meta = {
          id: payload.taskId,
          taskId: payload.taskId,
          domain: payload.domain,
          target: payload.target,
          description: payload.description ?? null
        }
        dispatch(upsertGeeExport({ ...buildSubmittedGeeExportPayload(meta), updatedAt: Date.now() }))
      }

      if (type === 'GEE_OPERATION_RESULT' && payload?.taskId != null) {
        dispatch(
          applyEeOperationResult({
            taskId: payload.taskId,
            raw: payload.raw,
            error: payload.error
          })
        )
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [dispatch, organizationId, projectId, taskId, token])
}
