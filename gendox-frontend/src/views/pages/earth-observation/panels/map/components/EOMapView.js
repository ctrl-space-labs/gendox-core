import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

import GeeLayer from './GeeLayer'
import MapRefCapture from './MapRefCapture'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const MapController = dynamic(() => import('src/views/pages/earth-observation/panels/map/components/MapController'), {
  ssr: false
})
const DrawingManager = dynamic(() => import('src/views/pages/earth-observation/panels/map/components/DrawingManager'), {
  ssr: false
})

export default function EOMapView({
  mapLayers,
  mapCenter,
  visibleLayers,
  layerOpacities,
  activeTool,
  pendingVertices,
  geometries,
  selectedGeometryIndex,
  onMapReady,
  onMapClick,
  onFinish,
  onSelectGeometry,
  onUpdateGeometry
}) {
  return (
    <MapContainer center={[37.9838, 23.7275]} zoom={6} style={{ height: '100%', width: '100%' }}>
      <TileLayer attribution='&copy; OpenStreetMap' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
      {mapLayers.map((layer, i) => (
        <GeeLayer key={i} url={layer.url} opacity={visibleLayers.has(i) ? layerOpacities[i] ?? 1 : 0} />
      ))}
      <MapRefCapture onReady={onMapReady} />
      {mapCenter && <MapController centerData={mapCenter} />}
      <DrawingManager
        activeTool={activeTool}
        pendingVertices={pendingVertices}
        geometries={geometries}
        onMapClick={onMapClick}
        onFinish={onFinish}
        selectedIndex={selectedGeometryIndex}
        onSelectGeometry={onSelectGeometry}
        onUpdateGeometry={onUpdateGeometry}
      />
    </MapContainer>
  )
}
