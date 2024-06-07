import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import projectService from "src/gendox-sdk/projectService";

export const fetchProject = createAsyncThunk(
  "activeProject/fetchProject",
  async ({ organizationId, projectId, storedToken }, thunkAPI) => {
    try {
      const projectPromise = projectService.getProjectById(organizationId, projectId, storedToken);
      const membersPromise = projectService.getProjectMembers(organizationId, projectId, storedToken);

      // Use Promise.all to wait for both promises to resolve
      const [projectData, membersData] = await Promise.all([projectPromise, membersPromise]);

      // Return combined data
      return { project: projectData.data, members: membersData.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);


// Define the initial state
const initialActiveProjectState = {
  projectDetails: {},
  projectMembers: [], 
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
      .addCase(fetchProject.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.projectDetails = action.payload.project;
        state.projectMembers = action.payload.members;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const activeProjectActions = activeProjectSlice.actions;
export default activeProjectSlice.reducer;
