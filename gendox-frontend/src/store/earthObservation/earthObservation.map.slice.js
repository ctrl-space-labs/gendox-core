export const mapInitialState = {
  isGeeReady: false,
  mapLayers: [], // [{ url, name }]
  mapThumbnailUrl: null, // auto-thumbnail after script run (from Map.setCenter region)
  screenshotUrl: null, // on-demand screenshot from the camera button (current viewport)
  mapCenter: null,
  geeRunError: null,
  screenshotRequest: null, // { south, west, north, east } — set by MapPanel, consumed by GeeRunner
  printMessages: [] // collected print() output per execution
}

export const mapReducers = {
  setGeeReady: (state, action) => {
    state.map.isGeeReady = action.payload
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
