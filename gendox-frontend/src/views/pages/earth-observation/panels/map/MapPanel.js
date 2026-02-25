import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

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
  const mapLayerUrl = useSelector((state) => state.earthObservation.mapLayerUrl)
  const mapCenter = useSelector((state) => state.earthObservation.mapCenter)

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
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
    </Box>
  )
}
