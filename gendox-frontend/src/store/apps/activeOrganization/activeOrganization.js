import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import organizationService from "src/gendox-sdk/organizationService";
import aiModelService from "src/gendox-sdk/aiModelService";
import subscriptionPlanService from "src/gendox-sdk/subscriptionPlanService";

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

export const fetchAiModelProviders = createAsyncThunk(
  "activeOrganization/fetchAiModelProviders",
  async ({ organizationId, storedToken }, thunkAPI) => {
    try {
      const response = await aiModelService.getAllAiModelProviders(
        organizationId,
        storedToken
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const fetchOrganizationAiModelKeys = createAsyncThunk(
  "activeOrganization/fetchOrganizationAiModelKeys",
  async ({ organizationId, storedToken }, thunkAPI) => {
    try {
      const response = await aiModelService.getModelKeysByOrganizationId(
        organizationId,
        storedToken
      );
      return response.data.content;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const fetchOrganizationPlans = createAsyncThunk(
  "activeOrganization/fetchOrganizationPlans",
  async ({ organizationId, storedToken }, thunkAPI) => {
    try {
      const response = await subscriptionPlanService.getOrganizationPlans(
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
  aiModelProviders: [],
  aiModelKeys: [],
  organizationPlans: {},
  isBlurring: false,
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
      })

      // For fetching AI model providers
      .addCase(fetchAiModelProviders.pending, (state) => {
        state.isBlurring = true;
        state.error = null;
      })
      .addCase(fetchAiModelProviders.fulfilled, (state, action) => {
        state.isBlurring = false;
        state.aiModelProviders = action.payload;
      })
      .addCase(fetchAiModelProviders.rejected, (state, action) => {
        state.isBlurring = false;
        state.error = action.payload;
      })

      // For fetching AI model keys
      .addCase(fetchOrganizationAiModelKeys.pending, (state) => {
        state.isBlurring = true;
        state.error = null;
      })
      .addCase(fetchOrganizationAiModelKeys.fulfilled, (state, action) => {
        state.isBlurring = false;
        state.aiModelKeys = action.payload;
      })
      .addCase(fetchOrganizationAiModelKeys.rejected, (state, action) => {
        state.isBlurring = false;
        state.error = action.payload;
      })

      // For fetching organization plans
      .addCase(fetchOrganizationPlans.pending, (state) => {
        state.isBlurring = true;
        state.error = null;
      })
      .addCase(fetchOrganizationPlans.fulfilled, (state, action) => {
        state.isBlurring = false;
        state.organizationPlans = action.payload;
      })
      .addCase(fetchOrganizationPlans.rejected, (state, action) => {
        state.isBlurring = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const activeOrganizationActions = activeOrganizationSlice.actions;
export default activeOrganizationSlice.reducer;
