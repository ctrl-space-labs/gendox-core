import { createSlice } from '@reduxjs/toolkit'

const initialActiveDocumentState = { activeDocument: null }

const activeDocumentSlice = createSlice({
  name: 'activeDocument',
  initialState: initialActiveDocumentState,
  reducers: {
    getActiveDocument(state, action) {
      state.activeDocument = action.payload
    }
  }
})

export const activeDocumentActions = activeDocumentSlice.actions

export default activeDocumentSlice.reducer
