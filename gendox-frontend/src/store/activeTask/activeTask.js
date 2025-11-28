import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'

export const createTask = createAsyncThunk(
  'task/createTask',
  async ({ organizationId, projectId, taskPayload, token }, thunkAPI) => {
    try {
      console.log("All parameters:", { organizationId, projectId, taskPayload, token });
      const response = await taskService.createTask(organizationId, projectId, taskPayload, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const fetchTasks = createAsyncThunk(
  'task/fetchTasks',
  async ({ organizationId, projectId, token }, thunkAPI) => {
    try {
      const response = await taskService.getTasks(organizationId, projectId, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const updateTask = createAsyncThunk(
  'task/updateTask',
  async ({ organizationId, projectId, taskId, token, updatePayload }, thunkAPI) => {
    try {
      console.log('AAll parameters:', { organizationId, projectId, taskId, token, updatePayload });
      const response = await taskService.updateTask(organizationId, projectId, taskId, token, updatePayload)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const fetchTaskById = createAsyncThunk(
  'task/fetchTaskById',
  async ({ organizationId, projectId, taskId, token }, thunkAPI) => {
    try {
      const response = await taskService.getTaskById(organizationId, projectId, taskId, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const deleteTask = createAsyncThunk(
  'task/deleteTask',
  async ({ organizationId, projectId, taskId, token }, thunkAPI) => {
    try {
      await taskService.deleteTask(organizationId, projectId, taskId, token)
      return taskId
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const executeTaskByType = createAsyncThunk(
  'task/executeTaskByType',
  async ({ organizationId, projectId, taskId, criteria, token }, thunkAPI) => {
    try {
      const response = await taskService.executeTaskByType(organizationId, projectId, taskId, criteria, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

const initialState = {
  projectTasks: [],
  selectedTask: null,
  isLoading: false,
  error: null
}

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(createTask.pending, state => {
        state.isLoading = true
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false
        state.projectTasks.push(action.payload)
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.projectTasks = action.payload
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.selectedTask = action.payload
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.projectTasks.findIndex(t => t.id === action.payload.id)
        if (idx !== -1) state.projectTasks[idx] = action.payload
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.projectTasks = state.projectTasks.filter(t => t.id !== action.payload)
        if (state.selectedTask?.id === action.payload) state.selectedTask = null
      })
      
  }
})

export default taskSlice.reducer

