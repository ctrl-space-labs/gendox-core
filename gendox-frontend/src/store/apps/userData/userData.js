import { createSlice } from '@reduxjs/toolkit'

const initialUserDataState = { userProfile: null}

const userDataSlice = createSlice({
  name: 'userData',
  initialState: initialUserDataState,
  reducers: {
    getUserData(state, action) {
      state.userProfile = action.payload
    }
  }
})

export const userDataActions = userDataSlice.actions

export default userDataSlice.reducer
