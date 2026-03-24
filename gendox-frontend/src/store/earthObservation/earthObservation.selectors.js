// Layout
export const selectLayoutMode = state => state.earthObservation.layout.layoutMode
export const selectSplitX = state => state.earthObservation.layout.splitX
export const selectSplitY = state => state.earthObservation.layout.splitY
export const selectChatMin = state => state.earthObservation.layout.chatMin
export const selectEditorMin = state => state.earthObservation.layout.editorMin
export const selectMapMin = state => state.earthObservation.layout.mapMin

// Map / GEE
export const selectIsGeeReady = state => state.earthObservation.map.isGeeReady
export const selectMapLayers = state => state.earthObservation.map.mapLayers
export const selectMapThumbnailUrl = state => state.earthObservation.map.mapThumbnailUrl
export const selectScreenshotUrl = state => state.earthObservation.map.screenshotUrl
export const selectMapCenter = state => state.earthObservation.map.mapCenter
export const selectGeeRunError = state => state.earthObservation.map.geeRunError
export const selectScreenshotRequest = state => state.earthObservation.map.screenshotRequest

// Scripts
export const selectEoScripts = state => state.earthObservation.scripts.eoScripts
export const selectLatestEOScript = state => state.earthObservation.scripts.latestEOScript
export const selectLatestEOScriptLoading = state => state.earthObservation.scripts.latestEOScriptLoading
export const selectCreateEOScriptLoading = state => state.earthObservation.scripts.createEOScriptLoading

// Geometries
export const selectEoGeometries = state => state.earthObservation.geometries.eoGeometries
export const selectEoGeometriesLoading = state => state.earthObservation.geometries.eoGeometriesLoading

// Derived: full geometry objects that are currently visible (isVisible flag on each object)
export const selectVisibleGeometries = state =>
  state.earthObservation.geometries.eoGeometries.filter(g => g.isVisible)

// Derived: next displayOrder = max existing + 1 (safe when geometries are deleted/reordered)
export const selectNextDisplayOrder = state => {
  const orders = state.earthObservation.geometries.eoGeometries.map(g => g.displayOrder ?? 0)
  return orders.length ? Math.max(...orders) + 1 : 1
}
