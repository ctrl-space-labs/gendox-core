import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import taskService from 'src/gendox-sdk/taskService'
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

  isGeeReady: false,
  mapLayerUrl: null,
  mapCenter: null,
  latestEOScript: null,
  latestEOScriptLoading: false,
  latestEOScriptError: null,

  createEOScriptLoading: false,
  createEOScriptError: null,

  geeOAuthToken: null
}

export const fetchLatestEOScriptThunk = createAsyncThunk(
  'earthObservation/fetchLatestEOScript',
  async ({ organizationId, projectId, taskId, token }, { rejectWithValue }) => {
    try {
      const res = await taskService.getLatestEOScript(organizationId, projectId, taskId, token)
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to fetch latest EOScript')
    }
  }
)

export const createEOScriptThunk = createAsyncThunk(
  'earthObservation/createEOScript',
  async ({ organizationId, projectId, taskId, eoScriptPayload, token }, { rejectWithValue }) => {
    try {
      const res = await taskService.createEOScript(organizationId, projectId, taskId, eoScriptPayload, token)
      return res.data
    } catch (err) {
      toast.error(getErrorMessage(err))
      return rejectWithValue(err?.response?.data?.message || err?.message || 'Failed to create EOScript')
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
      state.layoutMode = LAYOUT.MAP_MIN
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
    setMapLayer: (state, action) => {
      state.mapLayerUrl = action.payload
    },
    setMapData: (state, action) => {
      // The payload is expected to be: { url: string, center: object }
      if (action.payload.url) state.mapLayerUrl = action.payload.url
      if (action.payload.center) state.mapCenter = action.payload.center
    },
    setLatestEOScript: (state, action) => {
      state.latestEOScript = action.payload
    },

    setGeeOAuthToken: (state, action) => {
      state.geeOAuthToken = action.payload
    }
  },
  extraReducers: builder => {
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
      })
      .addCase(createEOScriptThunk.rejected, (state, action) => {
        state.createEOScriptLoading = false
        state.createEOScriptError = action.payload || 'Failed to create EOScript'
      })
  }
})

export const {
  setLayoutMode,
  maximizeMap,
  maximizeChat,
  maximizeEditor,
  minimizeMap,
  restoreDefault,
  setSplitX,
  setSplitY,
  minimizeChat,
  restoreChat,
  minimizeEditor,
  restoreEditor,
  setGeeReady,
  setMapLayer,
  setMapData,
  setLatestEOScript,
  setGeeOAuthToken
} = slice.actions

export default slice.reducer
