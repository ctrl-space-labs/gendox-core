import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import organizationService from "src/gendox-sdk/organizationService";
import aiModelService from "src/gendox-sdk/aiModelService";
import subscriptionPlanService from "src/gendox-sdk/subscriptionPlanService";
import apiKeyService from "src/gendox-sdk/apiKeyService";
import organizationWebSiteService from "src/gendox-sdk/organizationWebSiteService";
import { getErrorMessage } from "src/utils/errorHandler";
import toast from "react-hot-toast";

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
      toast.error(`Failed to fetch organization by ID status. Error: ${getErrorMessage(error)}`);
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
      toast.error(`Failed to fetch Ai model Providers. Error: ${getErrorMessage(error)}`);
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
      toast.error(`Failed to fetch organization Ai model keys. Error: ${getErrorMessage(error)}`);
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
      toast.error(`Failed to fetch organization plans. Error: ${getErrorMessage(error)}`);
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const fetchApiKeys = createAsyncThunk(
  "activeOrganization/fetchApiKeys",
  async ({ organizationId, storedToken }, thunkAPI) => {
    try {
      const response = await apiKeyService.getApiKeysByOrganizationId(
        organizationId,
        storedToken
      );      
      return response.data;
    } catch (error) {
      toast.error(`Failed to fetch API Keys. Error: ${getErrorMessage(error)}`);
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const fetchOrganizationWebSites = createAsyncThunk(
  "activeOrganization/fetchOrganizationWebSites",  
  async ({ organizationId, storedToken }, thunkAPI) => {    
    try {
      const response = await organizationWebSiteService.getOrganizationWebSitesByOrganizationId(
        organizationId,
        storedToken
      );
      return response.data;
    } catch (error) {
      toast.error(`Failed to fetch organization websites. Error: ${getErrorMessage(error)}`);
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
  apiKeys: [],
  organizationWebSites: [],
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
      })

      // For fetching API keys
      .addCase(fetchApiKeys.pending, (state) => {
        state.isBlurring = true;
        state.error = null;
      })
      .addCase(fetchApiKeys.fulfilled, (state, action) => {
        state.isBlurring = false;
        state.apiKeys = action.payload;
      })
      .addCase(fetchApiKeys.rejected , (state, action) => {
        state.isBlurring = false;
        state.error = action.payload;
      })

      // For fetching organization websites
      .addCase(fetchOrganizationWebSites.pending, (state) => {
        state.isBlurring = true;
        state.error = null;
      })
      .addCase(fetchOrganizationWebSites.fulfilled, (state, action) => {
        state.isBlurring = false;
        state.organizationWebSites = action.payload;        
      })
      
      .addCase(fetchOrganizationWebSites.rejected, (state, action) => {
        state.isBlurring = false;
        state.error = action.payload;
        
      });

  },
});

// Export actions and reducer
export const activeOrganizationActions = activeOrganizationSlice.actions;
export default activeOrganizationSlice.reducer;
