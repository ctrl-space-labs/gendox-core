import Box from '@mui/material/Box'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// React-Leaflet components must be loaded client-side (they depend on window)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })

export default function MapPanel() {
  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[36.2841, -112.8598]} // Grand Canyon demo
        zoom={9}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </Box>
  )
}
