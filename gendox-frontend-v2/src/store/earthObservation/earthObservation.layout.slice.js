import { LAYOUT, clamp } from './earthObservation.constants'

export const layoutInitialState = {
  layoutMode: LAYOUT.DEFAULT,
  splitX: 0.58, // map vs right
  splitY: 0.55, // chat vs editor
  chatMin: false,
  editorMin: false,
  mapMin: false
}

export const layoutReducers = {
  setLayoutMode: (state, action) => {
    state.layout.layoutMode = action.payload
  },
  maximizeMap: state => {
    state.layout.layoutMode = LAYOUT.MAP_MAX
    state.layout.mapMin = false
  },
  maximizeChat: state => {
    state.layout.layoutMode = LAYOUT.CHAT_MAX
    state.layout.chatMin = false
  },
  maximizeEditor: state => {
    state.layout.layoutMode = LAYOUT.EDITOR_MAX
    state.layout.editorMin = false
  },
  minimizeMap: state => {
    state.layout.mapMin = true
  },
  restoreMap: state => {
    state.layout.mapMin = false
  },
  restoreDefault: state => {
    state.layout.layoutMode = LAYOUT.DEFAULT
  },
  setSplitX: (state, action) => {
    state.layout.splitX = clamp(action.payload, 0.05, 0.95)
  },
  setSplitY: (state, action) => {
    state.layout.splitY = clamp(action.payload, 0.05, 0.95)
  },
  minimizeChat: state => {
    state.layout.chatMin = true
  },
  restoreChat: state => {
    state.layout.chatMin = false
  },
  minimizeEditor: state => {
    state.layout.editorMin = true
  },
  restoreEditor: state => {
    state.layout.editorMin = false
  },
  // Combined actions for restoring a panel that was minimised while in a MAX layout mode.
  // Using a single action avoids the double-dispatch anti-pattern and guarantees
  // the Redux state is consistent in one atomic step.
  restoreChatFromMax: state => {
    state.layout.chatMin = false
    state.layout.layoutMode = LAYOUT.DEFAULT
  },
  restoreEditorFromMax: state => {
    state.layout.editorMin = false
    state.layout.layoutMode = LAYOUT.DEFAULT
  }
}
