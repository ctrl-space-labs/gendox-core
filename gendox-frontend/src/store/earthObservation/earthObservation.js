import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import earthObservationService from 'src/gendox-sdk/earthObservationService'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'

export const LAYOUT = {
  DEFAULT: 'DEFAULT',
  MAP_MAX: 'MAP_MAX',
  CHAT_MAX: 'CHAT_MAX',
  EDITOR_MAX: 'EDITOR_MAX',
  MAP_MIN: 'MAP_MIN'
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

const initialState = {
  layoutMode: LAYOUT.DEFAULT,

  // ratios (0..1)
  splitX: 0.58, // map vs right
  splitY: 0.55, // chat vs editor

  // minimized -> lines
  chatMin: false,
  editorMin: false,
  mapMin: false,

  isGeeReady: false,
  mapLayers: [], // [{ url, name }]
  mapThumbnailUrl: null, // auto-thumbnail after script run (from Map.setCenter region)
  screenshotUrl: null, // on-demand screenshot from the camera button (current viewport)
  mapCenter: null,
  geeRunError: null,
  eoScripts: [],
  eoScriptsLoading: false,
  eoScriptsError: null,
  latestEOScript: null,
  latestEOScriptLoading: false,
  latestEOScriptError: null,

  eoGeometries: [],
  eoGeometriesLoading: false,
  eoGeometriesError: null,
  createEOGeometryLoading: false,
  createEOGeometryError: null,
  updateEOGeometryLoading: false,
  updateEOGeometryError: null,
  deleteEOGeometryLoading: false,
  deleteEOGeometryError: null,

  createEOScriptLoading: false,
  createEOScriptError: null,

  screenshotRequest: null // { south, west, north, east } — set by MapPanel, consumed by GeeRunner
}

export const fetchEOScriptsThunk = createAsyncThunk(
  'earthObservation/fetchEOScripts',
  async ({ organizationId, projectId, taskId, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.getEOScripts(organizationId, projectId, taskId, token)
      return res.data
    } catch (err) {
      if (err?.response?.status === 404) return []
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to fetch EOScripts')
    }
  }
)

export const fetchLatestEOScriptThunk = createAsyncThunk(
  'earthObservation/fetchLatestEOScript',
  async ({ organizationId, projectId, taskId, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.getLatestEOScript(organizationId, projectId, taskId, token)
      return res.data
    } catch (err) {
      if (err?.response?.status === 404) return null
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to fetch latest EOScript')
    }
  }
)

export const createEOScriptThunk = createAsyncThunk(
  'earthObservation/createEOScript',
  async ({ organizationId, projectId, taskId, eoScriptPayload, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.createEOScript(
        organizationId,
        projectId,
        taskId,
        eoScriptPayload,
        token
      )
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to create EOScript')
    }
  }
)

export const createEOGeometryThunk = createAsyncThunk(
  'earthObservation/createEOGeometry',
  async ({ organizationId, projectId, taskId, geometryPayload, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.createEOGeometry(
        organizationId,
        projectId,
        taskId,
        geometryPayload,
        token
      )
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to create EO geometry')
    }
  }
)

export const updateEOGeometryThunk = createAsyncThunk(
  'earthObservation/updateEOGeometry',
  async ({ organizationId, projectId, taskId, geometryId, geometryPayload, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.updateEOGeometry(
        organizationId,
        projectId,
        taskId,
        geometryId,
        geometryPayload,
        token
      )
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to update EO geometry')
    }
  }
)

export const deleteEOGeometryThunk = createAsyncThunk(
  'earthObservation/deleteEOGeometry',
  async ({ organizationId, projectId, taskId, geometryId, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.deleteEOGeometry(organizationId, projectId, taskId, geometryId, token)
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to delete EO geometry')
    }
  }
)

export const deleteEOGeometriesThunk = createAsyncThunk(
  'earthObservation/deleteEOGeometries',
  async ({ organizationId, projectId, taskId, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.deleteEOGeometries(organizationId, projectId, taskId, token)
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to delete EO geometries')
    }
  }
)

/**
 * Get EO geometries for a Task
 * @param organizationId
 * @param projectId
 * @param taskId
 * @param token
 * @returns {Promise<axios.AxiosResponse<EOGeometry[]>>}
 */
export const getEOGeometriesThunk = createAsyncThunk(
  'earthObservation/getEOGeometries',
  async ({ organizationId, projectId, taskId, token }, { rejectWithValue }) => {
    try {
      const res = await earthObservationService.getEOGeometries(organizationId, projectId, taskId, token)
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to fetch EO geometries')
    }
  }
)

const slice = createSlice({
  name: 'earthObservation',
  initialState,
  reducers: {
    setLayoutMode: (state, action) => {
      state.layoutMode = action.payload
    },

    // layout modes
    maximizeMap: state => {
      state.layoutMode = LAYOUT.MAP_MAX
      state.mapMin = false
    },
    maximizeChat: state => {
      state.layoutMode = LAYOUT.CHAT_MAX
      state.chatMin = false
    },
    maximizeEditor: state => {
      state.layoutMode = LAYOUT.EDITOR_MAX
      state.editorMin = false
    },
    minimizeMap: state => {
      state.mapMin = true
    },
    restoreMap: state => {
      state.mapMin = false
    },
    restoreDefault: state => {
      state.layoutMode = LAYOUT.DEFAULT
    },

    // ratios (0..1)
    setSplitX: (state, action) => {
      state.splitX = clamp(action.payload, 0.05, 0.95)
    },
    setSplitY: (state, action) => {
      state.splitY = clamp(action.payload, 0.05, 0.95)
    },

    // minimize/restore chat/editor
    minimizeChat: state => {
      state.chatMin = true
    },
    restoreChat: state => {
      state.chatMin = false
    },
    minimizeEditor: state => {
      state.editorMin = true
    },
    restoreEditor: state => {
      state.editorMin = false
    },
    setGeeReady: (state, action) => {
      state.isGeeReady = action.payload
    },
    setMapData: (state, action) => {
      if (action.payload.center) state.mapCenter = action.payload.center
    },
    addMapLayer: (state, action) => {
      // payload: { url, name }
      state.mapLayers.push(action.payload)
    },
    clearMapLayers: state => {
      state.mapLayers = []
    },
    setMapThumbnail: (state, action) => {
      state.mapThumbnailUrl = action.payload
    },
    setScreenshotUrl: (state, action) => {
      state.screenshotUrl = action.payload
    },
    setGeeRunError: (state, action) => {
      state.geeRunError = action.payload
    },
   
    setLatestEOScript: (state, action) => {
      state.latestEOScript = action.payload
    },
    requestScreenshot: (state, action) => {
      state.screenshotRequest = action.payload // { south, west, north, east }
    },
    clearScreenshotRequest: state => {
      state.screenshotRequest = null
    },
    resetEOScriptState: state => {
      state.eoScripts = []
      state.eoScriptsLoading = false
      state.eoScriptsError = null
      state.latestEOScript = null
      state.latestEOScriptLoading = false
      state.latestEOScriptError = null
      state.createEOScriptLoading = false
      state.createEOScriptError = null
      state.mapLayers = []
      state.mapThumbnailUrl = null
      state.screenshotUrl = null
      state.mapCenter = null
      state.geeRunError = null
      state.eoGeometries = []
      state.eoGeometriesLoading = false
      state.eoGeometriesError = null
      state.createEOGeometryLoading = false
      state.createEOGeometryError = null
      state.updateEOGeometryLoading = false
      state.updateEOGeometryError = null
      state.deleteEOGeometryLoading = false
      state.deleteEOGeometryError = null
    }
  },
  extraReducers: builder => {
    // --- fetch all ---
    builder
      .addCase(fetchEOScriptsThunk.pending, state => {
        state.eoScriptsLoading = true
        state.eoScriptsError = null
      })
      .addCase(fetchEOScriptsThunk.fulfilled, (state, action) => {
        state.eoScriptsLoading = false
        state.eoScripts = action.payload
      })
      .addCase(fetchEOScriptsThunk.rejected, (state, action) => {
        state.eoScriptsLoading = false
        state.eoScriptsError = action.payload || 'Failed to fetch EOScripts'
      })

    // --- fetch latest ---
    builder
      .addCase(fetchLatestEOScriptThunk.pending, state => {
        state.latestEOScriptLoading = true
        state.latestEOScriptError = null
      })
      .addCase(fetchLatestEOScriptThunk.fulfilled, (state, action) => {
        state.latestEOScriptLoading = false
        state.latestEOScript = action.payload
      })
      .addCase(fetchLatestEOScriptThunk.rejected, (state, action) => {
        state.latestEOScriptLoading = false
        state.latestEOScriptError = action.payload || 'Failed to fetch latest EOScript'
      })

    // --- create (optimistic) ---
    builder
      .addCase(createEOScriptThunk.pending, (state, action) => {
        state.createEOScriptLoading = true
        state.createEOScriptError = null

        // Optimistic update: show the new script immediately in the UI
        const p = action.meta.arg?.eoScriptPayload
        if (p) {
          state.latestEOScript = {
            ...p,
            id: 'optimistic',
            taskId: action.meta.arg?.taskId,
            isLatestVersion: true
          }
        }
      })
      .addCase(createEOScriptThunk.fulfilled, (state, action) => {
        state.createEOScriptLoading = false
        state.latestEOScript = action.payload
        // Keep eoScripts list in sync: prepend (dedup by id in case backend returned existing)
        if (action.payload?.id) {
          state.eoScripts = [action.payload, ...state.eoScripts.filter(s => s.id !== action.payload.id)]
        }
      })
      .addCase(createEOScriptThunk.rejected, (state, action) => {
        state.createEOScriptLoading = false
        state.createEOScriptError = action.payload || 'Failed to create EOScript'
      })
      .addCase(getEOGeometriesThunk.pending, state => {
        state.eoGeometriesLoading = true
        state.eoGeometriesError = null
      })
      .addCase(getEOGeometriesThunk.fulfilled, (state, action) => {
        state.eoGeometriesLoading = false
        state.eoGeometries = action.payload
      })
      .addCase(getEOGeometriesThunk.rejected, (state, action) => {
        state.eoGeometriesLoading = false
        state.eoGeometriesError = action.payload || 'Failed to fetch EO geometries'
      })
      .addCase(createEOGeometryThunk.pending, state => {
        state.createEOGeometryLoading = true
        state.createEOGeometryError = null
      })
      .addCase(createEOGeometryThunk.fulfilled, (state, action) => {
        state.createEOGeometryLoading = false
        state.eoGeometries.push(action.payload)
      })
      .addCase(createEOGeometryThunk.rejected, (state, action) => {
        state.createEOGeometryLoading = false
        state.createEOGeometryError = action.payload || 'Failed to create EO geometry'
      })
      .addCase(updateEOGeometryThunk.fulfilled, (state, action) => {
        state.updateEOGeometryLoading = false
        const updated = action.payload
        const index = state.eoGeometries.findIndex(g => g.id === updated.id)
        if (index !== -1) {
          state.eoGeometries[index] = updated
        }
      })
      .addCase(updateEOGeometryThunk.rejected, (state, action) => {
        state.updateEOGeometryLoading = false
        state.updateEOGeometryError = action.payload || 'Failed to update EO geometry'
      })
      .addCase(updateEOGeometryThunk.pending, state => {
        state.updateEOGeometryLoading = true
        state.updateEOGeometryError = null
      })

      .addCase(deleteEOGeometryThunk.pending, state => {
        state.deleteEOGeometryLoading = true
        state.deleteEOGeometryError = null
      })
      .addCase(deleteEOGeometryThunk.fulfilled, (state, action) => {
        state.deleteEOGeometryLoading = false
        const deletedId = action.meta.arg.geometryId
        state.eoGeometries = state.eoGeometries.filter(g => g.id !== deletedId)
      })
      .addCase(deleteEOGeometryThunk.rejected, (state, action) => {
        state.deleteEOGeometryLoading = false
        state.deleteEOGeometryError = action.payload || 'Failed to delete EO geometry'
      })
      .addCase(deleteEOGeometriesThunk.pending, state => {
        state.deleteEOGeometryLoading = true
        state.deleteEOGeometryError = null
      })
      .addCase(deleteEOGeometriesThunk.fulfilled, state => {
        state.deleteEOGeometryLoading = false
        state.eoGeometries = []
      })
      .addCase(deleteEOGeometriesThunk.rejected, (state, action) => {
        state.deleteEOGeometryLoading = false
        state.deleteEOGeometryError = action.payload || 'Failed to delete EO geometries'
      })
  }
})

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
