import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import documentService from "src/gendox-sdk/documentService";

// Define an async thunk for fetching an organization by ID
export const fetchDocumentById = createAsyncThunk(
  "activeDocument/fetchByIdStatus",
  async ({ organizationId, projectId, documentId, storedToken }, thunkAPI) => {
    try {
      const response = await documentService.getDocumentById(
        organizationId,
        projectId,
        documentId,
        storedToken
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Define the initial state
const initialActiveDocumentState = {
  activeDocument: {},
  error: null,
};

// Create the slice
const activeDocumentSlice = createSlice({
  name: "activeDocument",
  initialState: initialActiveDocumentState,
  reducers: {
    // Standard reducer logic can be added here if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocumentById.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.activeDocument = action.payload;
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const activeDocumentActions = activeDocumentSlice.actions;
export default activeDocumentSlice.reducer;
