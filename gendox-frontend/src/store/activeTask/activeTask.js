import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import taskService from 'src/gendox-sdk/taskService' // <-- you'll create this SDK client to call your backend APIs
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'

// Async thunk to create a new task
export const createTask = createAsyncThunk(
  'task/createTask',
  async ({ organizationId, projectId, taskPayload, token }, thunkAPI) => {
    try {
      const response = await taskService.createTask(organizationId, projectId, taskPayload, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Async thunk to get all tasks of a project
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

// Async to get task by ID
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

// Similarly for TaskNode
export const createTaskNode = createAsyncThunk(
  'task/createTaskNode',
  async ({ organizationId, projectId, taskNodePayload, token }, thunkAPI) => {
    try {
      const response = await taskService.createTaskNode(organizationId, projectId, taskNodePayload, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const fetchTaskNodeById = createAsyncThunk(
  'task/fetchTaskNodeById',
  async ({ organizationId, projectId, taskId, token }, thunkAPI) => {
    try {
      const response = await taskService.getTaskNodeById(organizationId, projectId, taskId, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Similarly for TaskEdge
export const createTaskEdge = createAsyncThunk(
  'task/createTaskEdge',
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
  'task/fetchTaskEdgeById',
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

// Initial state for task slice
const initialState = {
  projectTasks: [],
  selectedTask: null,
  taskNodes: {},
  taskEdges: {},
  isLoading: false,
  error: null
}

// Slice
const taskSlice = createSlice({
  name: 'activeTask',
  initialState,
  reducers: {
    // Add any synchronous reducers here if needed
  },
  extraReducers: builder => {
    builder
      // Create Task
      .addCase(createTask.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false
        state.projectTasks.push(action.payload)
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Fetch Tasks
      .addCase(fetchTasks.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false
        state.projectTasks = action.payload
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Fetch Task By ID
      .addCase(fetchTaskById.pending, state => {
        state.isLoading = true
        state.error = null
        state.selectedTask = null // optional: clear previous selection
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.isLoading = false
        state.selectedTask = action.payload
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Create TaskNode
      .addCase(createTaskNode.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createTaskNode.fulfilled, (state, action) => {
        state.isLoading = false
        state.taskNodes[action.payload.id] = action.payload
      })
      .addCase(createTaskNode.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Fetch TaskNode by ID
      .addCase(fetchTaskNodeById.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTaskNodeById.fulfilled, (state, action) => {
        state.isLoading = false
        state.taskNodes[action.payload.id] = action.payload
      })
      .addCase(fetchTaskNodeById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Create TaskEdge
      .addCase(createTaskEdge.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createTaskEdge.fulfilled, (state, action) => {
        state.isLoading = false
        state.taskEdges[action.payload.id] = action.payload
      })
      .addCase(createTaskEdge.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Fetch TaskEdge by ID
      .addCase(fetchTaskEdgeById.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTaskEdgeById.fulfilled, (state, action) => {
        state.isLoading = false
        state.taskEdges[action.payload.id] = action.payload
      })
      .addCase(fetchTaskEdgeById.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export default taskSlice.reducer
