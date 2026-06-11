import { createSlice } from '@reduxjs/toolkit'

import { buildExportTaskPayload } from './geeExportPayload'
import { layoutInitialState, layoutReducers } from './earthObservation.layout.slice'
import { mapInitialState, mapReducers } from './earthObservation.map.slice'
import { scriptsInitialState, scriptsReducers, addScriptsExtraReducers } from './earthObservation.scripts.slice'
import { geometriesInitialState, geometriesReducers, addGeometriesExtraReducers } from './earthObservation.geometries.slice'

const slice = createSlice({
  name: 'earthObservation',
  initialState: {
    layout: { ...layoutInitialState },
    map: { ...mapInitialState },
    scripts: { ...scriptsInitialState },
    geometries: { ...geometriesInitialState }
  },
  reducers: {
    ...layoutReducers,
    ...mapReducers,
    ...scriptsReducers,
    ...geometriesReducers
  },
  extraReducers: builder => {
    addScriptsExtraReducers(builder)
    addGeometriesExtraReducers(builder)
  }
})

export * from './earthObservation.constants'
export * from './earthObservation.thunks'
export * from './earthObservation.selectors'

export const {
  setSessionExpired,
  setLayoutMode,
  maximizeMap,
  maximizeChat,
  maximizeEditor,
  minimizeMap,
  restoreMap,
  restoreDefault,
  setSplitX,
  setSplitY,
  minimizeChat,
  restoreChat,
  minimizeEditor,
  restoreEditor,
  restoreChatFromMax,
  restoreEditorFromMax,
  setGeeReady,
  setGeeUserEmail,
  setGeeProjectFallbackActive,
  setMapData,
  addMapLayer,
  clearMapLayers,
  setMapThumbnail,
  setScreenshotUrl,
  setGeeRunError,
  setLatestEOScript,
  resetEOScriptState,
  requestScreenshot,
  clearScreenshotRequest,
  appendPrintMessage,
  clearPrintMessages,
  upsertGeeExport,
  clearGeeExports,
  toggleGeometryVisibility,
  tileLayerLoaded,
  setMapResultScreenshot,
  clearMapResultScreenshot
} = slice.actions

export const applyEeOperationResult =
  ({ taskId, raw, error }) =>
  (dispatch, getState) => {
    if (!taskId) return
    const rows = getState().earthObservation.map.geeExports
    const row = rows.find(e => e.id === taskId || e.taskId === taskId)
    if (!row) return
    const meta = {
      id: taskId,
      taskId,
      domain: row.domain,
      target: row.target,
      description: row.description
    }
    const errObj = error != null && error !== '' ? { message: typeof error === 'string' ? error : error.message } : null
    const payload = buildExportTaskPayload(meta, 'status', raw, errObj)
    dispatch(upsertGeeExport({ ...payload, updatedAt: Date.now() }))
  }

export default slice.reducer
