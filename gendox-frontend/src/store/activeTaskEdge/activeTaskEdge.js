import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'

export const createTaskEdge = createAsyncThunk(
  'taskEdge/create',
  async ({ organizationId, projectId, taskEdgePayload, token }, thunkAPI) => {
    try {
      const response = await taskService.createTaskEdge(organizationId, projectId, taskEdgePayload, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const fetchTaskEdgeById = createAsyncThunk(
  'taskEdge/fetchById',
  async ({ organizationId, projectId, id, token }, thunkAPI) => {
    try {
      const response = await taskService.getTaskEdgeById(organizationId, projectId, id, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const fetchTaskEdgesByCriteria = createAsyncThunk(
  'taskEdge/fetchByCriteria',
  async ({ organizationId, projectId, criteria, token }, thunkAPI) => {
    try {
      const response = await taskService.getTaskEdgesByCriteria(organizationId, projectId, criteria, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

const initialState = {
  taskEdges: {},
  taskEdgesList: [],
  isLoading: false,
  error: null
}

const taskEdgeSlice = createSlice({
  name: 'taskEdge',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(createTaskEdge.fulfilled, (state, action) => {
        state.taskEdges[action.payload.id] = action.payload
      })
      .addCase(fetchTaskEdgeById.fulfilled, (state, action) => {
        state.taskEdges[action.payload.id] = action.payload
      })
      .addCase(fetchTaskEdgesByCriteria.fulfilled, (state, action) => {
        state.taskEdgesList = action.payload
      })
  }
})

export default taskEdgeSlice.reducer