import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import { useRouter } from 'next/router'

import { localStorageConstants } from 'src/utils/generalConstants'
import { getEOGeometriesThunk } from 'src/store/earthObservation'

import useMapScreenshot from './hooks/useMapScreenshot'
import useLayerControls from './hooks/useLayerControls'
import useGeometryDrawing from './hooks/useGeometryDrawing'
import useGeometryInspector from './hooks/useGeometryInspector'
import { normalizeGeometries } from './utils/geometryHelpers'

import EOMapView from './components/EOMapView'
import DrawingToolbar from './components/DrawingToolbar'
import ScreenshotToolbar from './components/ScreenshotToolbar'
import LayersPanel from './components/LayersPanel'
import GeometryInspector from './components/GeometryInspector'

export default function MapPanel() {
  const dispatch = useDispatch()
  const router = useRouter()
  const token = localStorage.getItem(localStorageConstants.accessTokenKey)
  const { organizationId, projectId, taskId } = router.query

  const mapCenter = useSelector(state => state.earthObservation.map.mapCenter)
  const mapThumbnailUrl = useSelector(state => state.earthObservation.map.mapThumbnailUrl)
  const eoGeometries = useSelector(state => state.earthObservation.geometries.eoGeometries)

  const {
    mapLayers,
    visibleLayers,
    layerOpacities,
    layersOpen,
    panelRef,
    setVisibleLayers,
    setLayerOpacities,
    setLayersOpen
  } = useLayerControls()

  const { isCapturing, isPanelCapturing, handleScreenshot, handlePanelScreenshot, handleMapReady } =
    useMapScreenshot(panelRef)

  const { activeTool, pendingVertices, canFinish, handleMapClick, handleSelectTool, handleFinish, handleCancel } =
    useGeometryDrawing({ organizationId, projectId, taskId, token })

  const {
    selectedGeometryIndex,
    inspectorOpen,
    setInspectorOpen,
    handleToggleVisibility,
    inspectorRowRefs,
    handleSelectGeometry,
    handleUpdateGeometry,
    handleUpdateTitle,
    handleCopyGeometry,
    handleDeleteGeometry,
    handleDeleteAllGeometries
  } = useGeometryInspector({ organizationId, projectId, taskId, token })

  useEffect(() => {
    if (organizationId && projectId && taskId && token) {
      dispatch(getEOGeometriesThunk({ organizationId, projectId, taskId, token }))
    }
  }, [organizationId, projectId, taskId, token])

  const geometries = normalizeGeometries(eoGeometries)

  return (
    <Box ref={panelRef} sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <EOMapView
        mapLayers={mapLayers}
        mapCenter={mapCenter}
        visibleLayers={visibleLayers}
        layerOpacities={layerOpacities}
        activeTool={activeTool}
        pendingVertices={pendingVertices}
        geometries={geometries}
        selectedGeometryIndex={selectedGeometryIndex}
        onMapReady={handleMapReady}
        onMapClick={handleMapClick}
        onFinish={handleFinish}
        onSelectGeometry={handleSelectGeometry}
        onUpdateGeometry={handleUpdateGeometry}
      />

      {/* ── Left vertical toolbar — top-anchored ── */}
      <Box
        sx={{
          position: 'absolute',
          left: 10,
          top: 90,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.25,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2.5,
          boxShadow: 8,
          p: 0.75
        }}
      >
        {/* Drawing tools */}
        <DrawingToolbar
          activeTool={activeTool}
          pendingVertices={pendingVertices}
          canFinish={canFinish}
          onSelectTool={handleSelectTool}
          onFinish={handleFinish}
          onCancel={handleCancel}
        />

        <Divider flexItem sx={{ my: 0.5 }} />

        {/* Screenshot */}
        <ScreenshotToolbar
          mapThumbnailUrl={mapThumbnailUrl}
          mapLayersCount={mapLayers.length}
          isCapturing={isCapturing}
          isPanelCapturing={isPanelCapturing}
          onScreenshot={handleScreenshot}
          onPanelScreenshot={() => handlePanelScreenshot(panelRef.current)}
        />

        <Divider flexItem sx={{ my: 0.5 }} />

        {/* Geometry inspector toggle */}
        <GeometryInspector
          geometries={geometries}
          inspectorOpen={inspectorOpen}
          setInspectorOpen={setInspectorOpen}
          inspectorRowRefs={inspectorRowRefs}
          onToggleVisibility={handleToggleVisibility}
          onUpdateTitle={handleUpdateTitle}
          onCopyGeometry={handleCopyGeometry}
          onDeleteGeometry={handleDeleteGeometry}
          onDeleteAll={handleDeleteAllGeometries}
        />
      </Box>

      {/* ── Layers panel — standalone, top-right, always mounted ── */}
      <Box sx={{ position: 'absolute', top: 16, right: 10, zIndex: 1000 }}>
        <LayersPanel
          mapLayers={mapLayers}
          visibleLayers={visibleLayers}
          layerOpacities={layerOpacities}
          layersOpen={layersOpen}
          setVisibleLayers={setVisibleLayers}
          setLayerOpacities={setLayerOpacities}
          setLayersOpen={setLayersOpen}
        />
      </Box>
    </Box>
  )
}
