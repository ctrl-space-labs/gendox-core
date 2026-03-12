import { GEOM_TYPE_MAP } from '../constants/geometryConstants'

const TYPE_LABELS = { Point: 'Point', LinearRing: 'Linear Ring', Polygon: 'Polygon' }

export function geomLabel(geom, index) {
  if (geom.title) return geom.title
  if (geom.name) return geom.name
  return `${TYPE_LABELS[geom.type] ?? geom.type} ${index + 1}`
}

export function geomSummary(geom, index) {
  if (geom.type === 'Point') {
    const [lon, lat] = geom.coordinates
    return `${geomLabel(geom, index)} (${lon.toFixed(2)}, ${lat.toFixed(2)})`
  }
  if (geom.type === 'LinearRing') return `${geomLabel(geom, index)} · ${geom.coordinates.length} pts`
  if (geom.type === 'Polygon') return `${geomLabel(geom, index)} · ${geom.coordinates[0].length - 1} pts`
  return geomLabel(geom, index)
}

export function normalizeGeometries(eoGeometries) {
  return (eoGeometries ?? []).map(g => ({
    ...g,
    type: GEOM_TYPE_MAP[g.geometryTypeName] ?? g.geometryTypeName,
    coordinates: typeof g.coordinates === 'string' ? JSON.parse(g.coordinates) : g.coordinates
  }))
}
