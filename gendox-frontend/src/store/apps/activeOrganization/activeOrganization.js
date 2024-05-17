import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import organizationService from "src/gendox-sdk/organizationService";

// Define an async thunk for fetching an organization by ID
export const fetchOrganization = createAsyncThunk(
  "activeOrganization/fetchByIdStatus",
  async ({ organizationId, storedToken }, thunkAPI) => {
    try {
      const response = await organizationService.getOrganizationById(
        organizationId,
        storedToken
      );

      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Define the initial state
const initialActiveOrganizationState = {
  activeOrganization: {},
  error: null,
};

// Create the slice
const activeOrganizationSlice = createSlice({
  name: "activeOrganization",
  initialState: initialActiveOrganizationState,
  reducers: {
    // Standard reducer logic can be added here if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganization.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchOrganization.fulfilled, (state, action) => {
        state.activeOrganization = action.payload;
      })
      .addCase(fetchOrganization.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const activeOrganizationActions = activeOrganizationSlice.actions;
export default activeOrganizationSlice.reducer;
