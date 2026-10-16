import { useEffect } from 'react'
import { useMap } from 'react-leaflet'

// The map's window can be resized, minimized or moved to another window; Leaflet only measures itself when told.
export default function MapResizeWatcher() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => {
      if (container.offsetWidth && container.offsetHeight) map.invalidateSize({ pan: false })
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [map])

  return null
}
