export const mapInitialState = {
  isGeeReady: false,
  geeUserEmail: null, // Google account email connected to GEE (distinct from the Gendox user)
  // true when the org has a GEE project ID configured but EE init failed with it
  // (API disabled, wrong ID, missing access). We fall back to the rate-limited shared
  // tier so the workspace still opens; the header warns the user.
  geeProjectFallbackActive: false,
  sessionExpired: false, // true when token expired mid-session; shows Snackbar instead of blocking dialog
  mapLayers: [], // [{ url, name }]
  loadedLayerCount: 0, // incremented each time a GeeLayer fires its Leaflet 'load' event
  mapResultScreenshot: null, // data URL of the latest auto/manual full-panel screenshot
  mapThumbnailUrl: null, // auto-thumbnail after script run (from Map.setCenter region)
  screenshotUrl: null, // on-demand screenshot from the camera button (current viewport)
  mapCenter: null,
  geeRunError: null,
  screenshotRequest: null, // { south, west, north, east } — set by MapPanel, consumed by GeeRunner
  printMessages: [], // collected print() output per execution
  geeExports: [] // batch export tasks from GEE sandbox (frontend-only; keyed by id)
}

export const mapReducers = {
  setGeeReady: (state, action) => {
    state.map.isGeeReady = action.payload
    if (action.payload) state.map.sessionExpired = false // clear on successful (re)auth
  },
  setGeeUserEmail: (state, action) => {
    state.map.geeUserEmail = action.payload || null
  },
  setGeeProjectFallbackActive: (state, action) => {
    state.map.geeProjectFallbackActive = Boolean(action.payload)
  },
  setSessionExpired: (state, action) => {
    state.map.sessionExpired = action.payload
  },
  setMapData: (state, action) => {
    if (action.payload.center) state.map.mapCenter = action.payload.center
    if (action.payload.zoom != null) {
      if (state.map.mapCenter) state.map.mapCenter.zoom = action.payload.zoom
      else state.map.mapCenter = { lon: 0, lat: 0, zoom: action.payload.zoom }
    }
  },
  addMapLayer: (state, action) => {
    // payload: { url, name }
    state.map.mapLayers.push(action.payload)
  },
  clearMapLayers: state => {
    state.map.mapLayers = []
    state.map.loadedLayerCount = 0
    state.map.mapResultScreenshot = null
  },
  upsertGeeExport: (state, action) => {
    const p = action.payload || {}
    const id = p.id ?? p.taskId
    if (!id) return
    const updatedAt = p.updatedAt ?? Date.now()
    const next = { ...p, id, taskId: id, updatedAt }
    const idx = state.map.geeExports.findIndex(e => e.id === id)
    if (idx >= 0) state.map.geeExports[idx] = { ...state.map.geeExports[idx], ...next }
    else state.map.geeExports.unshift(next)
  },
  clearGeeExports: state => {
    state.map.geeExports = []
  },
  setMapResultScreenshot: (state, action) => {
    state.map.mapResultScreenshot = action.payload
  },
  clearMapResultScreenshot: state => {
    state.map.mapResultScreenshot = null
  },
  tileLayerLoaded: state => {
    state.map.loadedLayerCount += 1
  },
  setMapThumbnail: (state, action) => {
    state.map.mapThumbnailUrl = action.payload
  },
  setScreenshotUrl: (state, action) => {
    state.map.screenshotUrl = action.payload
  },
  setGeeRunError: (state, action) => {
    state.map.geeRunError = action.payload
  },
  requestScreenshot: (state, action) => {
    state.map.screenshotRequest = action.payload // { south, west, north, east }
  },
  clearScreenshotRequest: state => {
    state.map.screenshotRequest = null
  },
  appendPrintMessage: (state, action) => {
    state.map.printMessages.push(action.payload) // payload: string
  },
  clearPrintMessages: state => {
    state.map.printMessages = []
  }
}
