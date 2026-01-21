import { createSlice } from '@reduxjs/toolkit'

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
  editorMin: false
}

const slice = createSlice({
  name: 'seaScope',
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
    }
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
  restoreEditor
} = slice.actions

export default slice.reducer