import { createSlice } from '@reduxjs/toolkit'

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
  toggleGeometryVisibility,
  tileLayerLoaded,
  setMapResultScreenshot,
  clearMapResultScreenshot
} = slice.actions

export default slice.reducer
