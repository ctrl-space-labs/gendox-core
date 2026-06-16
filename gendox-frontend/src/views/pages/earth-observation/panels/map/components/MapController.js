import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

// this component is mounted inside the MapContainer and listens for changes to the centerData prop,
// and is responsible for moving the map.
export default function MapController({ centerData }) {
  const map = useMap()

  useEffect(() => {
    if (centerData) {
      // GEE provides (lon, lat), Leaflet expects [lat, lon]
      // We use flyTo for smooth animation or setView for immediate change
      map.setView([centerData.lat, centerData.lon], centerData.zoom || 8)
    }
  }, [centerData, map])

  return null
}