import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

// Αυτό το component έχει πρόσβαση στο map instance
// και αναλαμβάνει να μετακινεί τον χάρτη.
export default function MapController({ centerData }) {
  const map = useMap()

  useEffect(() => {
    if (centerData) {
      // Το GEE δίνει (lon, lat), το Leaflet θέλει [lat, lon]
      // Χρησιμοποιούμε το flyTo για ωραίο animation ή setView για άμεσο
      map.setView([centerData.lat, centerData.lon], centerData.zoom || 8)
    }
  }, [centerData, map])

  return null
}