import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import documentService from "src/gendox-sdk/documentService";

// Define an async thunk for fetching an organization by ID
export const fetchDocument = createAsyncThunk(
  "activeDocument/fetchDocument",
  async ({ documentId, storedToken }, thunkAPI) => {    
    try {
      const documentPromise = await documentService.getDocumentById(        
        documentId,
        storedToken
      );

      const documentData = await documentPromise;
      return { document: documentData.data, sections: documentData.data.documentInstanceSections};
      
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Define the initial state
const initialActiveDocumentState = {
  document: {},
  sections: [],
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
      .addCase(fetchDocument.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchDocument.fulfilled, (state, action) => {
        state.document = action.payload.document;
        state.sections = action.payload.sections;
      })
      .addCase(fetchDocument.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const activeDocumentActions = activeDocumentSlice.actions;
export default activeDocumentSlice.reducer;
