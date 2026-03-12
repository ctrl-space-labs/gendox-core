import { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'

import {
  updateEOGeometryThunk,
  deleteEOGeometryThunk,
  deleteEOGeometriesThunk
} from 'src/store/earthObservation'

export default function useGeometryInspector({ organizationId, projectId, taskId, token }) {
  const dispatch = useDispatch()
  const eoGeometries = useSelector(state => state.earthObservation.geometries.eoGeometries)
  const [selectedGeometryIndex, setSelectedGeometryIndex] = useState(null)
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const inspectorRowRefs = useRef({})

  const handleSelectGeometry = index => {
    setSelectedGeometryIndex(index)
    if (index !== null) setInspectorOpen(true) // auto-open inspector when map selects a geometry
  }

  // Auto-scroll the inspector to the selected row
  useEffect(() => {
    if (selectedGeometryIndex !== null) {
      inspectorRowRefs.current[selectedGeometryIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedGeometryIndex])

  const handleUpdateGeometry = (index, geometry) => {
    const existing = eoGeometries[index]
    if (!existing?.id) return
    dispatch(
      updateEOGeometryThunk({
        organizationId,
        projectId,
        taskId,
        geometryId: existing.id,
        geometryPayload: {
          geometryTypeName: existing.geometryTypeName,
          coordinates: JSON.stringify(geometry.coordinates),
          displayOrder: existing.displayOrder
        },
        token
      })
    )
  }

  const handleCopyGeometry = geom => {
    let text = ''
    if (geom.type === 'Point') {
      const [lon, lat] = geom.coordinates
      text = `ee.Geometry.Point([${lon}, ${lat}])`
    } else if (geom.type === 'LinearRing') {
      const coords = geom.coordinates.map(([lon, lat]) => `[${lon}, ${lat}]`).join(', ')
      text = `ee.Geometry.LinearRing([${coords}])`
    } else if (geom.type === 'Polygon') {
      const ring = geom.coordinates[0].map(([lon, lat]) => `[${lon}, ${lat}]`).join(', ')
      text = `ee.Geometry.Polygon([[${ring}]])`
    }
    navigator.clipboard?.writeText(text).then(() => toast.success('Coordinates copied!'))
  }

  const handleDeleteGeometry = (geometryId, index) => {
    if (selectedGeometryIndex === index) setSelectedGeometryIndex(null)
    dispatch(deleteEOGeometryThunk({ organizationId, projectId, taskId, geometryId, token }))
  }

  const handleDeleteAllGeometries = () => {
    dispatch(deleteEOGeometriesThunk({ organizationId, projectId, taskId, token }))
  }

  return {
    selectedGeometryIndex,
    setSelectedGeometryIndex,
    inspectorOpen,
    setInspectorOpen,
    inspectorRowRefs,
    handleSelectGeometry,
    handleUpdateGeometry,
    handleCopyGeometry,
    handleDeleteGeometry,
    handleDeleteAllGeometries
  }
}
