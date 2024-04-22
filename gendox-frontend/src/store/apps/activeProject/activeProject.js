// import { createSlice } from '@reduxjs/toolkit'

// const initialActiveProjectState = { activeProject: null }

// const ActiveProjectSlice = createSlice({
//   name: 'activeProject',
//   initialState: initialActiveProjectState,
//   reducers: {
//     getActiveProject(state, action) {
//       state.activeProject = action.payload
//     }
//   }
// })

// export const activeProjectActions = ActiveProjectSlice.actions

// export default ActiveProjectSlice.reducer

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import projectService from "src/gendox-sdk/projectService";

// Define an async thunk for fetching an organization by ID
export const fetchProjectById = createAsyncThunk(
  "activeProject/fetchByIdStatus",
  async ({ organizationId, projectId, storedToken }, thunkAPI) => {
    try {
      const response = await projectService.getProjectById(
        organizationId,
        projectId,
        storedToken
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Define the initial state
const initialActiveProjectState = {
  activeProject: {},
  error: null,
};

// Create the slice
const activeProjectSlice = createSlice({
  name: "activeProject",
  initialState: initialActiveProjectState,
  reducers: {
    // Standard reducer logic can be added here if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectById.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.activeProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const activeProjectActions = activeProjectSlice.actions;
export default activeProjectSlice.reducer;
