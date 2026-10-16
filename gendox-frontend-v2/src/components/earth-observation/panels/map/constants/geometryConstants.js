import { MapPin, Pentagon, Spline } from 'lucide-react'

export const GEOM_TYPE_MAP = {
  POINT: 'Point',
  LINEAR_RING: 'LinearRing',
  POLYGON: 'Polygon'
}

export const GEOM_ICON = {
  Point: MapPin,
  LinearRing: Spline,
  Polygon: Pentagon
}
