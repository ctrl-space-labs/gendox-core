import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

export default function useLayerControls() {
  const mapLayers = useSelector(state => state.earthObservation.map.mapLayers)
  const [visibleLayers, setVisibleLayers] = useState(new Set())
  const [layerOpacities, setLayerOpacities] = useState([])
  const [layersOpen, setLayersOpen] = useState(true)
  const [panelWide, setPanelWide] = useState(true)
  const panelRef = useRef(null)

  // When new layers arrive, make them all visible and fully opaque by default
  useEffect(() => {
    setVisibleLayers(new Set(mapLayers.map((_, i) => i)))
    setLayerOpacities(mapLayers.map(() => 1))
  }, [mapLayers.length])

  // Hide opacity sliders when the map panel is narrower than 400px
  useEffect(() => {
    if (!panelRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setPanelWide(entry.contentRect.width >= 400)
    })
    ro.observe(panelRef.current)
    return () => ro.disconnect()
  }, [])

  return {
    mapLayers,
    visibleLayers,
    layerOpacities,
    layersOpen,
    panelWide,
    panelRef,
    setVisibleLayers,
    setLayerOpacities,
    setLayersOpen
  }
}
