import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'

import { localStorageConstants } from 'src/utils/generalConstants'
import { getEOGeometriesThunk, selectGeeExports } from 'src/store/earthObservation'

import useMapScreenshot from './hooks/useMapScreenshot'
import useLayerControls from './hooks/useLayerControls'
import useGeometryDrawing from './hooks/useGeometryDrawing'
import useGeometryInspector from './hooks/useGeometryInspector'
import { normalizeGeometries } from './utils/geometryHelpers'

import EOMapView from './components/EOMapView'
import DrawingToolbar, { DrawingHint } from './components/DrawingToolbar'
import ScreenshotToolbar from './components/ScreenshotToolbar'
import LayersPanel from './components/LayersPanel'
import ExportsPanel from './components/ExportsPanel'
import GeometryInspector, { GeometryButton } from './components/GeometryInspector'

export default function MapPanel() {
  const dispatch = useDispatch()
  const router = useRouter()
  const token = localStorage.getItem(localStorageConstants.accessTokenKey)
  const { organizationId, projectId, taskId } = router.query

  const mapCenter = useSelector(state => state.earthObservation.map.mapCenter)
  const eoGeometries = useSelector(state => state.earthObservation.geometries.eoGeometries)
  const geeExports = useSelector(selectGeeExports)

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

  const { isPanelCapturing, handlePanelScreenshot, handleMapReady } =
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

  // a new shape opens the shapes panel, so it can be named
  const shapeCount = useRef(geometries.length)
  useEffect(() => {
    if (geometries.length > shapeCount.current) setInspectorOpen(true)
    shapeCount.current = geometries.length
  }, [geometries.length, setInspectorOpen])

  return (
    <div ref={panelRef} className={`eo-map ${activeTool ? 'drawing' : ''}`}>
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

      {/* the left toolbar: drawing tools, screenshot, shapes */}
      <div className='float eo-tools' data-html2canvas-ignore=''>
        <DrawingToolbar activeTool={activeTool} onSelectTool={handleSelectTool} />
        <hr />
        <ScreenshotToolbar isPanelCapturing={isPanelCapturing} onPanelScreenshot={() => handlePanelScreenshot(panelRef.current)} />
        <hr />
        <GeometryButton geometries={geometries} inspectorOpen={inspectorOpen} setInspectorOpen={setInspectorOpen} />
      </div>

      <GeometryInspector
        geometries={geometries}
        inspectorOpen={inspectorOpen}
        setInspectorOpen={setInspectorOpen}
        inspectorRowRefs={inspectorRowRefs}
        selectedGeometryIndex={selectedGeometryIndex}
        onToggleVisibility={handleToggleVisibility}
        onUpdateTitle={handleUpdateTitle}
        onCopyGeometry={handleCopyGeometry}
        onDeleteGeometry={handleDeleteGeometry}
        onDeleteAll={handleDeleteAllGeometries}
      />

      {/* the script's layers and exports, top right */}
      <div className='eo-right'>
        <LayersPanel
          mapLayers={mapLayers}
          visibleLayers={visibleLayers}
          layerOpacities={layerOpacities}
          layersOpen={layersOpen}
          setVisibleLayers={setVisibleLayers}
          setLayerOpacities={setLayerOpacities}
          setLayersOpen={setLayersOpen}
        />
        <ExportsPanel geeExports={geeExports} />
      </div>

      <DrawingHint
        activeTool={activeTool}
        pendingVertices={pendingVertices}
        canFinish={canFinish}
        onFinish={handleFinish}
        onCancel={handleCancel}
      />
    </div>
  )
}
