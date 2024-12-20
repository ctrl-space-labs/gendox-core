import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import projectService from "src/gendox-sdk/projectService";
import documentService from "src/gendox-sdk/documentService";
import { getErrorMessage } from "src/utils/errorHandler";
import toast from "react-hot-toast";

export const fetchProject = createAsyncThunk(
  "activeProject/fetchProject",
  async ({ organizationId, projectId, storedToken }, thunkAPI) => {
    try {
      const projectPromise = projectService.getProjectById(
        organizationId,
        projectId,
        storedToken
      );
      const membersPromise = projectService.getProjectMembers(
        organizationId,
        projectId,
        storedToken
      );

      // Use Promise.all to wait for both promises to resolve
      const [projectData, membersData] = await Promise.all([
        projectPromise,
        membersPromise,
      ]);

      // Return combined data
      return { project: projectData.data, members: membersData.data };
    } catch (error) {
      console.error("Failed to fetch project", error);
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const fetchProjectDocuments = createAsyncThunk(
  "activeProject/fetchProjectDocuments",
  async ({ organizationId, projectId, storedToken, page }, thunkAPI) => {
    try {
      const response = await documentService.getDocumentByProject(
        organizationId,
        projectId,
        storedToken,
        page
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch project documents", error);
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Define the initial state
const initialActiveProjectState = {
  projectDetails: {},
  projectMembers: [],
  projectDocuments: { content: [], totalPages: 0 },
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
        state.isBlurring = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.isBlurring = false;
        state.projectDetails = action.payload.project;
        state.projectMembers = action.payload.members;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.isBlurring = false;
        state.error = action.payload;
      })

      .addCase(fetchProjectDocuments.pending, (state) => {
        state.isBlurring = true;
        state.error = null;
      })
      .addCase(fetchProjectDocuments.fulfilled, (state, action) => {
        state.isBlurring = false;
        state.projectDocuments = action.payload;
      })
      .addCase(fetchProjectDocuments.rejected, (state, action) => {
        state.isBlurring = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const activeProjectActions = activeProjectSlice.actions;
export default activeProjectSlice.reducer;
