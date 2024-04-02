import { createSlice } from '@reduxjs/toolkit'

const initialActiveOrganizationState = { activeOrganization: { id: null, projects: [] } }

const activeOrganizationSlice = createSlice({
  name: 'activeOrganization',
  initialState: initialActiveOrganizationState,
  reducers: {
    getActiveOrganization(state, action) {
      state.activeOrganization = action.payload
    }
  }
})

export const activeOrganizationActions = activeOrganizationSlice.actions

export default activeOrganizationSlice.reducer
