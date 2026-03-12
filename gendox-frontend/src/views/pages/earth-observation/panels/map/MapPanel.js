import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Box from '@mui/material/Box'
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

  console.log("STATE", useSelector(state => state.earthObservation))

  const { isCapturing, handleScreenshot, handleMapReady } = useMapScreenshot()
  const {
    mapLayers,
    visibleLayers,
    layerOpacities,
    layersOpen,
    panelWide,
    panelRef,
    setVisibleLayers,
    setLayerOpacities,
    setLayersOpen
  } = useLayerControls()
  const { activeTool, pendingVertices, canFinish, handleMapClick, handleSelectTool, handleFinish, handleCancel } =
    useGeometryDrawing({ organizationId, projectId, taskId, token })
  const {
    selectedGeometryIndex,
    setSelectedGeometryIndex,
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
        onSelectGeometry={handleSelectGeometry}
        onUpdateGeometry={handleUpdateGeometry}
      />

      {/* ── Top-center toolbar row (drawing + screenshot + layers) ── */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 0.5
        }}
      >
        <DrawingToolbar
          activeTool={activeTool}
          pendingVertices={pendingVertices}
          canFinish={canFinish}
          onSelectTool={handleSelectTool}
          onFinish={handleFinish}
          onCancel={handleCancel}
        />
        <ScreenshotToolbar
          mapThumbnailUrl={mapThumbnailUrl}
          mapLayersCount={mapLayers.length}
          isCapturing={isCapturing}
          onScreenshot={handleScreenshot}
        />
        <LayersPanel
          mapLayers={mapLayers}
          visibleLayers={visibleLayers}
          layerOpacities={layerOpacities}
          layersOpen={layersOpen}
          panelWide={panelWide}
          setVisibleLayers={setVisibleLayers}
          setLayerOpacities={setLayerOpacities}
          setLayersOpen={setLayersOpen}
        />
      </Box>

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
  )
}
