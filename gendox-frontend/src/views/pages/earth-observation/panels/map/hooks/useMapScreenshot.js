import { useRef, useState, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { requestScreenshot, setScreenshotUrl } from 'src/store/earthObservation'
import { downloadFile } from '../utils/mapPanelHelpers'

export default function useMapScreenshot() {
  const dispatch = useDispatch()
  const screenshotUrl = useSelector(state => state.earthObservation.map.screenshotUrl)
  const [isCapturing, setIsCapturing] = useState(false)
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

  return { isCapturing, handleScreenshot, handleMapReady }
}
