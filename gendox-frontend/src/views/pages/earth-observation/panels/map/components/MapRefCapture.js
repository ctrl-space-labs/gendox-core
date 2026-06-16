import { useEffect } from 'react'
import dynamic from 'next/dynamic'

// Captures the Leaflet map instance so MapPanel can read bounds for screenshots.
// Must be rendered inside <MapContainer> where useMap() is available.
// useEffect is imported at module level and captured in the closure.
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

export default MapRefCapture
