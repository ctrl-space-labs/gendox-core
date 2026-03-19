import { useRef, useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import html2canvas from 'html2canvas'

import { requestScreenshot, setScreenshotUrl } from 'src/store/earthObservation'
import { copyImageToClipboard, downloadFile } from '../utils/mapPanelHelpers'

export default function useMapScreenshot() {
  const dispatch = useDispatch()
  const screenshotUrl = useSelector(state => state.earthObservation.map.screenshotUrl)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isPanelCapturing, setIsPanelCapturing] = useState(false)
  const mapInstanceRef = useRef(null)

  const handleMapReady = useCallback(map => {
    mapInstanceRef.current = map
  }, [])

  // Auto-download as soon as the screenshot lands in Redux, then clear it
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

  const handlePanelScreenshot = useCallback(async panelElement => {
    if (!panelElement) return
    try {
      setIsPanelCapturing(true)
      const canvas = await html2canvas(panelElement, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        scale: window.devicePixelRatio || 1,
        logging: false,
        ignoreElements: el =>
          el.classList?.contains('minimap-decorations-layer') ||
          (el.tagName === 'CANVAS' && el.closest('.monaco-editor'))
      })
      const dataUrl = canvas.toDataURL('image/png')
      await copyImageToClipboard(dataUrl)
    } catch (err) {
      console.warn('Panel screenshot failed:', err)
    } finally {
      setIsPanelCapturing(false)
    }
  }, [])

  return { isCapturing, isPanelCapturing, handleScreenshot, handlePanelScreenshot, handleMapReady }
}
