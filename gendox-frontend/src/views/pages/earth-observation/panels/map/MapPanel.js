import { useState, useCallback, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'

import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

import CameraAltIcon from '@mui/icons-material/CameraAlt'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import TimelineIcon from '@mui/icons-material/Timeline'
import HexagonIcon from '@mui/icons-material/Hexagon'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import LayersIcon from '@mui/icons-material/Layers'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

import {
  setMapThumbnail,
  setScreenshotUrl,
  addDrawnGeometry,
  removeDrawnGeometry,
  clearDrawnGeometries,
  updateDrawnGeometry,
  requestScreenshot
} from 'src/store/earthObservation/earthObservation'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const MapController = dynamic(() => import('src/views/pages/earth-observation/components/MapController'), {
  ssr: false
})
const DrawingManager = dynamic(() => import('src/views/pages/earth-observation/components/DrawingManager'), {
  ssr: false
})

// Captures the Leaflet map instance so MapPanel can read bounds for screenshots.
// Must be rendered inside <MapContainer> where useMap() is available.
const MapRefCapture = dynamic(
  () =>
    import('react-leaflet').then(({ useMap }) => ({
      default: function MapRefCaptureInner({ onReady }) {
        const map = useMap()
        useEffect(() => {
          if (map) onReady(map)
        }, [map, onReady])
        return null
      }
    })),
  { ssr: false }
)

const GeeLayer = ({ url, opacity = 1 }) => {
  if (!url) return null
  return <TileLayer url={url} opacity={opacity} />
}

// Returns a one-line summary for the geometry inspector (GEE style).
const geomSummary = (geom, i) => {
  if (geom.type === 'Point') {
    const [lon, lat] = geom.coordinates
    return `${i}: Point (${lon.toFixed(2)}, ${lat.toFixed(2)})`
  }
  if (geom.type === 'LinearRing') return `${i}: LinearRing, ${geom.coordinates.length} vertices`
  if (geom.type === 'Polygon') return `${i}: Polygon, ${geom.coordinates[0].length} vertices`
  return `${i}: ${geom.type}`
}

export default function MapPanel() {
  const dispatch = useDispatch()
  // ── Redux state ──
  const mapLayers = useSelector(state => state.earthObservation.mapLayers)
  const mapCenter = useSelector(state => state.earthObservation.mapCenter)
  const mapThumbnailUrl = useSelector(state => state.earthObservation.mapThumbnailUrl)
  const screenshotUrl = useSelector(state => state.earthObservation.screenshotUrl)
  const drawnGeometries = useSelector(state => state.earthObservation.drawnGeometries)

  // ── Local state ──
  const [activeTool, setActiveTool] = useState(null) // 'point' | 'linearRing' | 'polygon' | null
  const [pendingVertices, setPendingVertices] = useState([]) // [[lat, lng], ...]
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [selectedGeometryIndex, setSelectedGeometryIndex] = useState(null) // index into geometries[]
  const [visibleLayers, setVisibleLayers] = useState(new Set()) // indices of visible layers
  const [layerOpacities, setLayerOpacities] = useState([])     // opacity 0-1 per layer index
  const [layersOpen, setLayersOpen] = useState(true)
  const [panelWide, setPanelWide] = useState(true) // false when map panel is too narrow to show sliders

  const [isCapturing, setIsCapturing] = useState(false)

  const inspectorRowRefs = useRef({}) // i -> DOM node for auto-scroll
  const panelRef = useRef(null)
  const mapInstanceRef = useRef(null) // holds the Leaflet map instance

  // Called by MapRefCapture once the Leaflet map instance is ready
  const handleMapReady = useCallback(map => {
    mapInstanceRef.current = map
  }, [])

  // When the user clicks the camera button, capture current viewport bounds and
  // dispatch to Redux — GeeRunner picks it up and asks the sandbox for a thumbnail.
  const handleScreenshot = () => {
    if (!mapInstanceRef.current) return
    const b = mapInstanceRef.current.getBounds()
    const zoom = mapInstanceRef.current.getZoom()
    setIsCapturing(true)
    dispatch(requestScreenshot({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast(), zoom }))
  }

  // Auto-download as soon as the screenshot lands in Redux, then clear it
  useEffect(() => {
    if (!screenshotUrl) return
    setIsCapturing(false)
    handleDownload(screenshotUrl, 'gee-screenshot.png')
    dispatch(setScreenshotUrl(null))
  }, [screenshotUrl])

  // Hide opacity sliders when the map panel is narrower than 400px
  useEffect(() => {
    if (!panelRef.current) return
    const ro = new ResizeObserver(([entry]) => {
      setPanelWide(entry.contentRect.width >= 400)
    })
    ro.observe(panelRef.current)
    return () => ro.disconnect()
  }, [])

  // When new layers arrive, make them all visible and fully opaque by default
  useEffect(() => {
    setVisibleLayers(new Set(mapLayers.map((_, i) => i)))
    setLayerOpacities(mapLayers.map(() => 1))
  }, [mapLayers.length])

  // ── Drawing handlers ──
  const handleMapClick = useCallback(
    (lat, lng) => {
      if (activeTool === 'point') {
        dispatch(addDrawnGeometry({ type: 'Point', coordinates: [lng, lat] }))
      } else {
        setPendingVertices(prev => [...prev, [lat, lng]])
      }
    },
    [activeTool, dispatch]
  )

  const handleSelectTool = tool => {
    setPendingVertices([])
    setActiveTool(prev => (prev === tool ? null : tool)) // toggle off if same tool clicked
  }

  const handleFinish = () => {
    if (activeTool === 'linearRing' && pendingVertices.length >= 2) {
      dispatch(
        addDrawnGeometry({
          type: 'LinearRing',
          coordinates: pendingVertices.map(([lat, lng]) => [lng, lat])
        })
      )
    } else if (activeTool === 'polygon' && pendingVertices.length >= 3) {
      const ring = pendingVertices.map(([lat, lng]) => [lng, lat])
      ring.push(ring[0]) // close the ring
      dispatch(addDrawnGeometry({ type: 'Polygon', coordinates: [ring] }))
    }
    setPendingVertices([])
    setActiveTool(null)
  }

  const handleCancel = () => {
    setPendingVertices([])
    setActiveTool(null)
  }

  const handleSelectGeometry = index => {
    setSelectedGeometryIndex(index)
    if (index !== null) setInspectorOpen(true) // auto-open inspector when map selects a geometry
  }

  const handleUpdateGeometry = (index, geometry) => {
    dispatch(updateDrawnGeometry({ index, geometry }))
  }

  // Auto-scroll the inspector to the selected row.
  useEffect(() => {
    if (selectedGeometryIndex !== null) {
      inspectorRowRefs.current[selectedGeometryIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedGeometryIndex])

  const handleCopyGeometry = geom => {
    let text = ''
    if (geom.type === 'Point') {
      const [lon, lat] = geom.coordinates
      text = `ee.Geometry.Point([${lon}, ${lat}])`
    } else if (geom.type === 'LinearRing') {
      const coords = geom.coordinates.map(([lon, lat]) => `[${lon}, ${lat}]`).join(', ')
      text = `ee.Geometry.LinearRing([${coords}])`
    } else if (geom.type === 'Polygon') {
      const ring = geom.coordinates[0].map(([lon, lat]) => `[${lon}, ${lat}]`).join(', ')
      text = `ee.Geometry.Polygon([[${ring}]])`
    }
    navigator.clipboard?.writeText(text).then(() => toast.success('Coordinates copied!'))
  }

  // ── Thumbnail / screenshot handlers ──
  const handleDownload = (url, filename = 'gee-map-result.png') => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleCopyImage = async url => {
    if (!url) return
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      toast.success('Image copied! You can now paste it anywhere.')
    } catch (err) {
      console.warn('Copy image failed:', err)
      toast.error('Copy failed — try Download instead.')
    }
  }

  // ── Derived ──
  const geometries = drawnGeometries?.geometries ?? []
  const canFinish =
    (activeTool === 'linearRing' && pendingVertices.length >= 2) ||
    (activeTool === 'polygon' && pendingVertices.length >= 3)

  const toolBtnSx = tool => ({
    width: 30,
    height: 30,
    p: 0,
    minWidth: 0,
    border: 1,
    borderColor: activeTool === tool ? 'primary.main' : 'divider',
    bgcolor: activeTool === tool ? 'primary.main' : 'background.paper',
    color: activeTool === tool ? '#fff' : 'text.primary',
    borderRadius: 1,
    '&:hover': { bgcolor: activeTool === tool ? 'primary.dark' : 'action.hover' }
  })

  return (
    <Box ref={panelRef} sx={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* ── Leaflet map ── */}
      <MapContainer center={[37.9838, 23.7275]} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
        {mapLayers.map((layer, i) => (
          <GeeLayer key={i} url={layer.url} opacity={visibleLayers.has(i) ? (layerOpacities[i] ?? 1) : 0} />
        ))}
        <MapRefCapture onReady={handleMapReady} />
        {mapCenter && <MapController centerData={mapCenter} />}
        <DrawingManager
          activeTool={activeTool}
          pendingVertices={pendingVertices}
          geometries={geometries}
          onMapClick={handleMapClick}
          selectedIndex={selectedGeometryIndex}
          onSelectGeometry={handleSelectGeometry}
          onUpdateGeometry={handleUpdateGeometry}
        />
      </MapContainer>

      {/* ── Top-center toolbar row (drawing + layers + snapshot) ── */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 0.5
        }}
      >
        {/* Drawing toolbar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            boxShadow: 2
          }}
        >
          <Tooltip title='Point'>
            <IconButton size='small' sx={toolBtnSx('point')} onClick={() => handleSelectTool('point')}>
              <RadioButtonUncheckedIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title='LinearRing'>
            <IconButton size='small' sx={toolBtnSx('linearRing')} onClick={() => handleSelectTool('linearRing')}>
              <TimelineIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title='Polygon'>
            <IconButton size='small' sx={toolBtnSx('polygon')} onClick={() => handleSelectTool('polygon')}>
              <HexagonIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>

          {/* Done / Cancel — shown only when drawing a line or polygon */}
          {activeTool && activeTool !== 'point' && (
            <>
              <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />
              <Tooltip title={canFinish ? 'Finish' : `Need ${activeTool === 'linearRing' ? 2 : 3}+ points`}>
                <span>
                  <IconButton
                    size='small'
                    disabled={!canFinish}
                    onClick={handleFinish}
                    sx={{ width: 30, height: 30, p: 0, border: 1, borderColor: 'divider', color: 'success.main' }}
                  >
                    <CheckIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title='Cancel'>
                <IconButton
                  size='small'
                  onClick={handleCancel}
                  sx={{ width: 30, height: 30, p: 0, border: 1, borderColor: 'divider', color: 'error.main' }}
                >
                  <CloseIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
              <Typography variant='caption' sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.65rem' }}>
                {pendingVertices.length} pt{pendingVertices.length !== 1 ? 's' : ''}
              </Typography>
            </>
          )}
        </Box>

        {/* Auto-thumbnail toolbar — appears after script run when GEE returns a thumbnail */}
        {mapThumbnailUrl && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              px: 1,
              py: 0.5,
              boxShadow: 2
            }}
          >
            <img
              src={mapThumbnailUrl}
              alt='GEE snapshot'
              style={{ width: 44, height: 30, objectFit: 'cover', borderRadius: 2, display: 'block' }}
            />
            <Divider orientation='vertical' flexItem sx={{ mx: 0.25 }} />
            <Tooltip title='Download'>
              <IconButton size='small' onClick={() => handleDownload(mapThumbnailUrl, 'gee-thumbnail.png')} sx={{ width: 30, height: 30, p: 0 }}>
                <FileDownloadIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title='Copy image'>
              <IconButton size='small' onClick={() => handleCopyImage(mapThumbnailUrl)} sx={{ width: 30, height: 30, p: 0 }}>
                <ContentCopyIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title='Dismiss'>
              <IconButton
                size='small'
                onClick={() => dispatch(setMapThumbnail(null))}
                sx={{ width: 30, height: 30, p: 0 }}
              >
                <CloseIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}


        {/* Screenshot button — capture current viewport as a GEE thumbnail */}
        {mapLayers.length > 0 && (
          <Tooltip title={isCapturing ? 'Capturing…' : 'Screenshot current view'}>
            <span>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  px: 0.75,
                  py: 0.5,
                  boxShadow: 2
                }}
              >
                <IconButton
                  size='small'
                  onClick={handleScreenshot}
                  disabled={isCapturing}
                  sx={{ width: 30, height: 30, p: 0 }}
                >
                  {isCapturing
                    ? <CircularProgress size={14} />
                    : <CameraAltIcon sx={{ fontSize: 15 }} />
                  }
                </IconButton>
              </Box>
            </span>
          </Tooltip>
        )}

        {/* Layers panel — appears when there are GEE layers */}
        {mapLayers.length > 0 && (
          <Box sx={{ position: 'relative' }}>
            {/* Header — same height as the other toolbars */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                boxShadow: 2,
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => setLayersOpen(p => !p)}
            >
              <LayersIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
              <Typography variant='caption' sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.72rem' }}>
                Layers ({mapLayers.length})
              </Typography>
              {layersOpen ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ExpandLessIcon sx={{ fontSize: 14 }} />}
            </Box>

            {/* Dropdown list — floats below without affecting the row height */}
            {layersOpen && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '100%',
                  ...(panelWide ? { left: 0 } : { right: 0 }),
                  mt: 0.5,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  boxShadow: 4,
                  width: panelWide ? 200 : 180,
                  px: 0.5,
                  py: 0.5,
                  zIndex: 1100
                }}
              >
                {mapLayers.map((layer, i) => {
                  const isVisible = visibleLayers.has(i)
                  return (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 0.5,
                        borderRadius: 0.5,
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <IconButton
                        size='small'
                        onClick={() =>
                          setVisibleLayers(prev => {
                            const next = new Set(prev)
                            isVisible ? next.delete(i) : next.add(i)
                            return next
                          })
                        }
                        sx={{ p: 0.25, flexShrink: 0 }}
                      >
                        {isVisible
                          ? <VisibilityIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                          : <VisibilityOffIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                        }
                      </IconButton>
                      <Tooltip title={layer.name} placement='top' enterDelay={500}>
                        <Typography
                          variant='caption'
                          noWrap
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.68rem',
                            flex: 1,
                            minWidth: 0,
                            color: isVisible ? 'text.primary' : 'text.disabled'
                          }}
                        >
                          {layer.name}
                        </Typography>
                      </Tooltip>
                      {panelWide && <input
                        type='range'
                        min={0}
                        max={1}
                        step={0.05}
                        value={layerOpacities[i] ?? 1}
                        disabled={!isVisible}
                        onChange={e =>
                          setLayerOpacities(prev => {
                            const next = [...prev]
                            next[i] = parseFloat(e.target.value)
                            return next
                          })
                        }
                        style={{
                          width: 70,
                          flexShrink: 0,
                          accentColor: '#08B68D',
                          cursor: isVisible ? 'pointer' : 'not-allowed',
                          opacity: isVisible ? 1 : 0.4
                        }}
                      />}
                    </Box>
                  )
                })}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* ── Geometry Inspector (top-right, GEE style) ── */}
      {geometries.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 12,
            zIndex: 1000,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 4,
            minWidth: 230,
            maxWidth: 300
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1,
              py: 0.5,
              borderBottom: inspectorOpen ? 1 : 0,
              borderColor: 'divider'
            }}
          >
            <Typography variant='caption' sx={{ flex: 1, fontWeight: 700, fontFamily: 'monospace' }}>
              Geometry Imports ({geometries.length})
            </Typography>
            <Tooltip title='Clear all'>
              <IconButton size='small' onClick={() => dispatch(clearDrawnGeometries())}>
                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <IconButton size='small' onClick={() => setInspectorOpen(p => !p)}>
              {inspectorOpen ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ExpandLessIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          </Box>

          {/* Body */}
          {inspectorOpen && (
            <Box sx={{ px: 1, py: 0.75, maxHeight: 180, overflowY: 'auto' }}>
              <Typography variant='caption' sx={{ display: 'block', fontFamily: 'monospace', color: 'text.secondary' }}>
                type: GeometryCollection
              </Typography>
              <Typography
                variant='caption'
                sx={{ display: 'block', fontFamily: 'monospace', color: 'text.secondary', mb: 0.5 }}
              >
                geometries: List ({geometries.length} elements)
              </Typography>
              {geometries.map((geom, i) => {
                const isSelected = selectedGeometryIndex === i
                return (
                  <Box
                    key={i}
                    ref={el => {
                      inspectorRowRefs.current[i] = el
                    }}
                    onClick={() => setSelectedGeometryIndex(isSelected ? null : i)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 0.5,
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'action.selected' : 'transparent',
                      borderLeft: isSelected ? '2px solid' : '2px solid transparent',
                      borderColor: isSelected ? 'primary.light' : 'transparent',
                      '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' }
                    }}
                  >
                    <Typography
                      variant='caption'
                      sx={{
                        flex: 1,
                        fontFamily: 'monospace',
                        pl: 1,
                        fontSize: '0.68rem',
                        color: isSelected ? 'primary.light' : 'text.primary'
                      }}
                    >
                      {geomSummary(geom, i)}
                    </Typography>
                    <Tooltip title='Copy as ee.Geometry'>
                      <IconButton
                        size='small'
                        onClick={e => {
                          e.stopPropagation()
                          handleCopyGeometry(geom)
                        }}
                        sx={{ p: 0.25 }}
                      >
                        <ContentCopyIcon sx={{ fontSize: 10 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Remove'>
                      <IconButton
                        size='small'
                        onClick={e => {
                          e.stopPropagation()
                          if (isSelected) setSelectedGeometryIndex(null)
                          dispatch(removeDrawnGeometry(i))
                        }}
                        sx={{ p: 0.25 }}
                      >
                        <CloseIcon sx={{ fontSize: 10 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
