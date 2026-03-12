import { createSlice } from '@reduxjs/toolkit'

import { layoutInitialState, layoutReducers } from './earthObservation.layout.slice'
import { mapInitialState, mapReducers } from './earthObservation.map.slice'
import { scriptsInitialState, scriptsReducers, addScriptsExtraReducers } from './earthObservation.scripts.slice'
import { geometriesInitialState, addGeometriesExtraReducers } from './earthObservation.geometries.slice'

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
    ...scriptsReducers
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
  clearScreenshotRequest
} = slice.actions

export default slice.reducer
