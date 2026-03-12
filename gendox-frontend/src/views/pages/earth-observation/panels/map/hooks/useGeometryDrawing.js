import { useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { createEOGeometryThunk } from 'src/store/earthObservation'

export default function useGeometryDrawing({ organizationId, projectId, taskId, token }) {
  const dispatch = useDispatch()
  const eoGeometries = useSelector(state => state.earthObservation.geometries.eoGeometries)
  const [activeTool, setActiveTool] = useState(null) // 'point' | 'linearRing' | 'polygon' | null
  const [pendingVertices, setPendingVertices] = useState([]) // [[lat, lng], ...]

  const handleMapClick = useCallback(
    (lat, lng) => {
      if (activeTool === 'point') {
        dispatch(
          createEOGeometryThunk({
            organizationId,
            projectId,
            taskId,
            geometryPayload: {
              geometryTypeName: 'POINT',
              coordinates: JSON.stringify([lng, lat]),
              displayOrder: eoGeometries.length
            },
            token
          })
        )
      } else {
        setPendingVertices(prev => [...prev, [lat, lng]])
      }
    },
    [activeTool, dispatch, organizationId, projectId, taskId, token, eoGeometries.length]
  )

  const handleSelectTool = tool => {
    setPendingVertices([])
    setActiveTool(prev => (prev === tool ? null : tool)) // toggle off if same tool clicked
  }

  const handleFinish = () => {
    if (activeTool === 'linearRing' && pendingVertices.length >= 2) {
      dispatch(
        createEOGeometryThunk({
          organizationId,
          projectId,
          taskId,
          geometryPayload: {
            geometryTypeName: 'LINEAR_RING',
            coordinates: JSON.stringify(pendingVertices.map(([lat, lng]) => [lng, lat])),
            displayOrder: eoGeometries.length
          },
          token
        })
      )
    } else if (activeTool === 'polygon' && pendingVertices.length >= 3) {
      const ring = pendingVertices.map(([lat, lng]) => [lng, lat])
      ring.push(ring[0]) // close the ring
      dispatch(
        createEOGeometryThunk({
          organizationId,
          projectId,
          taskId,
          geometryPayload: {
            geometryTypeName: 'POLYGON',
            coordinates: JSON.stringify([ring]),
            displayOrder: eoGeometries.length
          },
          token
        })
      )
    }
    setPendingVertices([])
    setActiveTool(null)
  }

  const handleCancel = () => {
    setPendingVertices([])
    setActiveTool(null)
  }

  const canFinish =
    (activeTool === 'linearRing' && pendingVertices.length >= 2) ||
    (activeTool === 'polygon' && pendingVertices.length >= 3)

  return { activeTool, pendingVertices, canFinish, handleMapClick, handleSelectTool, handleFinish, handleCancel }
}
