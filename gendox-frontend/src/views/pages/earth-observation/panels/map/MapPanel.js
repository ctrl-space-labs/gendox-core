import { useState, useCallback, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import 'leaflet/dist/leaflet.css'

import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import TimelineIcon from '@mui/icons-material/Timeline'
import HexagonIcon from '@mui/icons-material/Hexagon'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

import {
  setMapThumbnail,
  addDrawnGeometry,
  removeDrawnGeometry,
  clearDrawnGeometries,
  updateDrawnGeometry
} from 'src/store/earthObservation/earthObservation'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const MapController = dynamic(() => import('src/views/pages/earth-observation/components/MapController'), {
  ssr: false
})
const DrawingManager = dynamic(() => import('src/views/pages/earth-observation/components/DrawingManager'), {
  ssr: false
})

const GeeLayer = ({ url }) => {
  if (!url) return null
  return <TileLayer url={url} />
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
  const mapLayerUrl = useSelector(state => state.earthObservation.mapLayerUrl)
  const mapCenter = useSelector(state => state.earthObservation.mapCenter)
  const mapThumbnailUrl = useSelector(state => state.earthObservation.mapThumbnailUrl)
  const drawnGeometries = useSelector(state => state.earthObservation.drawnGeometries)

  // ── Local state ──
  const [activeTool, setActiveTool] = useState(null) // 'point' | 'linearRing' | 'polygon' | null
  const [pendingVertices, setPendingVertices] = useState([]) // [[lat, lng], ...]
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [selectedGeometryIndex, setSelectedGeometryIndex] = useState(null) // index into geometries[]

  const inspectorRowRefs = useRef({}) // i -> DOM node for auto-scroll

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

  // ── Thumbnail handlers ──
  const handleDownload = () => {
    if (!mapThumbnailUrl) return
    const a = document.createElement('a')
    a.href = mapThumbnailUrl
    a.download = 'gee-map-result.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleCopyImage = async () => {
    if (!mapThumbnailUrl) return
    try {
      const res = await fetch(mapThumbnailUrl)
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
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* ── Leaflet map ── */}
      <MapContainer center={[37.9838, 23.7275]} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
        <GeeLayer url={mapLayerUrl} />
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

      {/* ── Drawing toolbar (centered at top, like GEE) ── */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
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

      {/* ── Geometry Inspector (bottom-right, GEE style) ── */}
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
                      borderColor: isSelected ? '#FF6F00' : 'transparent',
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
                        color: isSelected ? '#FF6F00' : 'text.primary'
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

      {/* ── Thumbnail overlay (bottom-left) ── */}
      {mapThumbnailUrl && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 28,
            left: 12,
            zIndex: 1000,
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 4,
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            width: 190
          }}
        >
          <img
            src={mapThumbnailUrl}
            alt='GEE result thumbnail'
            style={{ width: '100%', borderRadius: 4, display: 'block' }}
          />
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button
              size='small'
              variant='outlined'
              sx={{ flex: 1, fontSize: '0.68rem', py: 0.25, minWidth: 0 }}
              onClick={handleDownload}
            >
              Download
            </Button>
            <Button
              size='small'
              variant='contained'
              sx={{ flex: 1, fontSize: '0.68rem', py: 0.25, minWidth: 0 }}
              onClick={handleCopyImage}
            >
              Copy
            </Button>
            <Button
              size='small'
              sx={{ minWidth: 'auto', px: 0.75, py: 0.25, fontSize: '0.68rem' }}
              onClick={() => dispatch(setMapThumbnail(null))}
            >
              ✕
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}
