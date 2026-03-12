import { GEOM_TYPE_MAP } from '../constants/geometryConstants'

export function geomSummary(geom, i) {
  if (geom.type === 'Point') {
    const [lon, lat] = geom.coordinates
    return `${i}: Point (${lon.toFixed(2)}, ${lat.toFixed(2)})`
  }
  if (geom.type === 'LinearRing') return `${i}: LinearRing, ${geom.coordinates.length} vertices`
  if (geom.type === 'Polygon') return `${i}: Polygon, ${geom.coordinates[0].length} vertices`
  return `${i}: ${geom.type}`
}

export function normalizeGeometries(eoGeometries) {
  return (eoGeometries ?? []).map(g => ({
    ...g,
    type: GEOM_TYPE_MAP[g.geometryTypeName] ?? g.geometryTypeName,
    coordinates: typeof g.coordinates === 'string' ? JSON.parse(g.coordinates) : g.coordinates
  }))
}
