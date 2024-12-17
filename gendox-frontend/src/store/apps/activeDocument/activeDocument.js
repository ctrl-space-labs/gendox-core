import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import documentService from "src/gendox-sdk/documentService";
import { getErrorMessage } from "src/utils/errorHandler";
import toast from "react-hot-toast";

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
      const orderedSections = documentData.data.documentInstanceSections.sort(
        (a, b) => {
          return (
            a.documentSectionMetadata.sectionOrder -
            b.documentSectionMetadata.sectionOrder
          );
        }
      );
      return { document: documentData.data, sections: orderedSections };
    } catch (error) {
      toast.error(`Failed to fetch Documents. Error: ${getErrorMessage(error)}`);
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Thunk action for updating section order
export const updateSectionsOrder = createAsyncThunk(
  "activeDocument/updateSectionsOrder",
  async ({ documentId, updatedSectionPayload, storedToken }, thunkAPI) => {
    try {
      await documentService.updateSectionsOrder(
        documentId,
        updatedSectionPayload,
        storedToken
      );
      return updatedSectionPayload; // Return the updated sections order
    } catch (error) {
      toast.error(`Sections order update failed. Error: ${getErrorMessage(error)}`);
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
    updateSectionOrder: (state, action) => {
      state.sections = action.payload;
    },
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
      })
      .addCase(updateSectionsOrder.fulfilled, (state, action) => {
        // Update the state with the new sections order
        state.sections = state.sections.map(section => {
          const updatedSection = action.payload.find(s => s.sectionId === section.id);
          return updatedSection ? { ...section, sectionOrder: updatedSection.sectionOrder } : section;
        });
      })
      .addCase(updateSectionsOrder.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase('activeDocument/updateSection', (state, action) => {
        state.sections = state.sections.map(section =>
          section.id === action.payload.sectionId
            ? { ...section, ...action.payload.updatedSection }
            : section
        );
      });
  },
});

// Export actions and reducer
export const { updateSectionOrder } = activeDocumentSlice.actions;
export default activeDocumentSlice.reducer;
