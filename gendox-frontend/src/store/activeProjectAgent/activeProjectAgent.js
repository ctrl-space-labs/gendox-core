import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import projectService from 'src/gendox-sdk/projectService'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'

// Async thunk to fetch AI models for the project agent
export const fetchAiModels = createAsyncThunk(
  'activeProjectAgent/fetchAiModels',
  async ({ organizationId, projectId, token }, thunkAPI) => {
    try {
      const response = await projectService.getAiModels(organizationId, projectId, token)
      return response.data
    } catch (error) {
      toast.error(`${getErrorMessage(error)}`)
      console.error('Failed to fetch AI models', error)
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Async thunk to update the project agent
export const updateProjectAgent = createAsyncThunk(
  'activeProjectAgent/updateProjectAgent',
  async ({ organizationId, projectId, payload, token }, thunkAPI) => {
    try {
      const response = await projectService.updateProject(organizationId, projectId, payload, token)
      return response.data
    } catch (error) {
      toast.error(`${getErrorMessage(error)}`)
      console.error('Failed to update project agent', error)
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

const initialState = {
  aiModels: {
    semanticModels: [],
    completionModels: [],
    moderationModels: [],
    rerankModels: []
  },
  isFetchingAiModels: false,
  isUpdatingProjectAgent: false,
  error: null
}

const activeProjectAgentSlice = createSlice({
  name: 'activeProjectAgent',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      // Handle fetching AI models
      .addCase(fetchAiModels.pending, state => {
        state.isFetchingAiModels = true
      })
      .addCase(fetchAiModels.fulfilled, (state, action) => {
        state.isFetchingAiModels = false
        const models = action.payload
        state.aiModels.semanticModels = models.filter(model => model.aiModelType.name === 'SEMANTIC_SEARCH_MODEL')
        state.aiModels.completionModels = models.filter(model => model.aiModelType.name === 'COMPLETION_MODEL')
        state.aiModels.moderationModels = models.filter(model => model.aiModelType.name === 'MODERATION_MODEL')
        state.aiModels.rerankModels = models.filter(model => model.aiModelType.name === 'RERANK_MODEL')
      })
      .addCase(fetchAiModels.rejected, (state, action) => {
        state.isFetchingAiModels = false
        state.fetchStatus = 'failed'
        state.error = action.payload
      })

      // Handle updating the project agent
      .addCase(updateProjectAgent.pending, state => {
        state.isUpdatingProjectAgent = true
      })
      .addCase(updateProjectAgent.fulfilled, state => {
        state.isUpdatingProjectAgent = false
      })
      .addCase(updateProjectAgent.rejected, (state, action) => {
        state.isUpdatingProjectAgent = false
        state.error = action.payload
      })
  }
})

export const { resetStatus } = activeProjectAgentSlice.actions
export default activeProjectAgentSlice.reducer
