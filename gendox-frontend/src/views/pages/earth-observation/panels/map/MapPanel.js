import { useSelector, useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

import toast from 'react-hot-toast'
import { setMapThumbnail } from 'src/store/earthObservation/earthObservation'

// 1. Dynamic Imports for react-leaflet components
// The ssr: false option is key to prevent running on the server
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })

// 2. Dynamic Import for the Controller we created
// I assumed you put it in components, change the path if needed
const MapController = dynamic(() => import('src/views/pages/earth-observation/components/MapController'), { ssr: false })

// 3. Helper Component for GEE Layer
const GeeLayer = ({ url }) => {
  if (!url) return null
  return <TileLayer url={url} />
}

export default function MapPanel() {
  const dispatch = useDispatch()
  const mapLayerUrl = useSelector((state) => state.earthObservation.mapLayerUrl)
  const mapCenter = useSelector((state) => state.earthObservation.mapCenter)
  const mapThumbnailUrl = useSelector((state) => state.earthObservation.mapThumbnailUrl)

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

  const handleDismiss = () => {
    dispatch(setMapThumbnail(null))
  }

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={[37.9838, 23.7275]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* The GEE Layer */}
        <GeeLayer url={mapLayerUrl} />

        {/* The Controller - will load only on the client */}
        {mapCenter && <MapController centerData={mapCenter} />}

      </MapContainer>

      {/* Thumbnail overlay — appears after a successful GEE script run */}
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
            alt="GEE result thumbnail"
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
              onClick={handleDismiss}
            >
              ✕
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  )
}
