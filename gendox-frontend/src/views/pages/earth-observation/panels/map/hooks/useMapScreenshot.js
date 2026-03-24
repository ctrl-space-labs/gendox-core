import { useRef, useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import html2canvas from 'html2canvas'

import { requestScreenshot, setScreenshotUrl, setMapResultScreenshot } from 'src/store/earthObservation'
import { copyImageToClipboard, downloadFile } from '../utils/mapPanelHelpers'

const HTML2CANVAS_OPTS = {
  useCORS: true,
  allowTaint: false,
  backgroundColor: null,
  scale: 1,
  logging: false,
  ignoreElements: el =>
    el.classList?.contains('minimap-decorations-layer') ||
    (el.tagName === 'CANVAS' && el.closest('.monaco-editor'))
}

export default function useMapScreenshot(panelRef) {
  const dispatch = useDispatch()
  const screenshotUrl = useSelector(state => state.earthObservation.map.screenshotUrl)
  const loadedLayerCount = useSelector(state => state.earthObservation.map.loadedLayerCount)
  const mapLayers = useSelector(state => state.earthObservation.map.mapLayers)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isPanelCapturing, setIsPanelCapturing] = useState(false)
  const mapInstanceRef = useRef(null)

  const handleMapReady = useCallback(map => {
    mapInstanceRef.current = map
  }, [])

  // Auto-download as soon as the GEE-based screenshot lands in Redux, then clear it
  useEffect(() => {
    if (!screenshotUrl) return
    setIsCapturing(false)
    downloadFile(screenshotUrl, 'gee-screenshot.png')
    dispatch(setScreenshotUrl(null))
  }, [screenshotUrl])

  const handleScreenshot = () => {
    if (!mapInstanceRef.current) return
    const b = mapInstanceRef.current.getBounds()
    const zoom = mapInstanceRef.current.getZoom()
    setIsCapturing(true)
    dispatch(
      requestScreenshot({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast(), zoom })
    )
  }

  // Renders the panel to a data URL, stores it in Redux, and returns it.
  // Does NOT copy to clipboard — used for auto-capture after script completion.
  const capturePanel = useCallback(async panelElement => {
    if (!panelElement) return null
    try {
      setIsPanelCapturing(true)
      const canvas = await html2canvas(panelElement, HTML2CANVAS_OPTS)
      const dataUrl = canvas.toDataURL('image/png')
      dispatch(setMapResultScreenshot(dataUrl))
      return dataUrl
    } catch (err) {
      console.warn('Panel screenshot failed:', err)
      return null
    } finally {
      setIsPanelCapturing(false)
    }
  }, [dispatch])

  // Button-triggered: capture, store in Redux, AND copy to clipboard.
  const handlePanelScreenshot = useCallback(async panelElement => {
    const dataUrl = await capturePanel(panelElement)
    if (dataUrl) await copyImageToClipboard(dataUrl)
  }, [capturePanel])

  // Auto-capture when all GEE layers have finished rendering their tiles.
  // Stores the screenshot in Redux but does NOT copy to clipboard.
  useEffect(() => {
    if (mapLayers.length > 0 && loadedLayerCount === mapLayers.length) {
      const timer = setTimeout(() => capturePanel(panelRef?.current), 1000)
      return () => clearTimeout(timer)
    }
  }, [loadedLayerCount, mapLayers.length, capturePanel, panelRef])

  return { isCapturing, isPanelCapturing, handleScreenshot, handlePanelScreenshot, handleMapReady }
}
