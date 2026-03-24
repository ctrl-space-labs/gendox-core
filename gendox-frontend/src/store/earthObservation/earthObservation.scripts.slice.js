import { fetchEOScriptsThunk, fetchLatestEOScriptThunk, createEOScriptThunk } from './earthObservation.thunks'

export const scriptsInitialState = {
  eoScripts: [],
  eoScriptsLoading: false,
  eoScriptsError: null,
  latestEOScript: null,
  latestEOScriptLoading: false,
  latestEOScriptError: null,
  createEOScriptLoading: false,
  createEOScriptError: null
}

export const scriptsReducers = {
  setLatestEOScript: (state, action) => {
    state.scripts.latestEOScript = action.payload
  },
  // Resets all data domains (scripts, map, geometries) when switching tasks/projects
  resetEOScriptState: state => {
    state.scripts.eoScripts = []
    state.scripts.eoScriptsLoading = false
    state.scripts.eoScriptsError = null
    state.scripts.latestEOScript = null
    state.scripts.latestEOScriptLoading = false
    state.scripts.latestEOScriptError = null
    state.scripts.createEOScriptLoading = false
    state.scripts.createEOScriptError = null
    state.map.mapLayers = []
    state.map.mapThumbnailUrl = null
    state.map.screenshotUrl = null
    state.map.mapCenter = null
    state.map.geeRunError = null
    state.geometries.eoGeometries = []
    state.geometries.eoGeometriesLoading = false
    state.geometries.eoGeometriesError = null
    state.geometries.createEOGeometryLoading = false
    state.geometries.createEOGeometryError = null
    state.geometries.updateEOGeometryLoading = false
    state.geometries.updateEOGeometryError = null
    state.geometries.deleteEOGeometryLoading = false
    state.geometries.deleteEOGeometryError = null
  }
}

export function addScriptsExtraReducers(builder) {
  builder
    .addCase(fetchEOScriptsThunk.pending, state => {
      state.scripts.eoScriptsLoading = true
      state.scripts.eoScriptsError = null
    })
    .addCase(fetchEOScriptsThunk.fulfilled, (state, action) => {
      state.scripts.eoScriptsLoading = false
      state.scripts.eoScripts = action.payload
    })
    .addCase(fetchEOScriptsThunk.rejected, (state, action) => {
      state.scripts.eoScriptsLoading = false
      state.scripts.eoScriptsError = action.payload || 'Failed to fetch EOScripts'
    })

    .addCase(fetchLatestEOScriptThunk.pending, state => {
      state.scripts.latestEOScriptLoading = true
      state.scripts.latestEOScriptError = null
    })
    .addCase(fetchLatestEOScriptThunk.fulfilled, (state, action) => {
      state.scripts.latestEOScriptLoading = false
      state.scripts.latestEOScript = action.payload
    })
    .addCase(fetchLatestEOScriptThunk.rejected, (state, action) => {
      state.scripts.latestEOScriptLoading = false
      state.scripts.latestEOScriptError = action.payload || 'Failed to fetch latest EOScript'
    })

    // Optimistic create: show new script immediately while POST is in flight
    .addCase(createEOScriptThunk.pending, (state, action) => {
      state.scripts.createEOScriptLoading = true
      state.scripts.createEOScriptError = null
      const p = action.meta.arg?.eoScriptPayload
      if (p) {
        state.scripts.latestEOScript = {
          ...p,
          id: 'optimistic',
          taskId: action.meta.arg?.taskId,
          isLatestVersion: true
        }
      }
    })
    .addCase(createEOScriptThunk.fulfilled, (state, action) => {
      state.scripts.createEOScriptLoading = false
      state.scripts.latestEOScript = action.payload
      // Keep eoScripts list in sync: prepend (dedup by id in case backend returned existing)
      if (action.payload?.id) {
        state.scripts.eoScripts = [
          action.payload,
          ...state.scripts.eoScripts.filter(s => s.id !== action.payload.id)
        ]
      }
    })
    .addCase(createEOScriptThunk.rejected, (state, action) => {
      state.scripts.createEOScriptLoading = false
      state.scripts.createEOScriptError = action.payload || 'Failed to create EOScript'
    })
}
