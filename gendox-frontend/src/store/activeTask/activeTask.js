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

export const updateTaskNode = createAsyncThunk(
  'task/updateTaskNode',
  async ({ organizationId, projectId, taskNodePayload, token }, thunkAPI) => {
    try {
      const response = await taskService.updateTaskNode(organizationId, projectId, taskNodePayload, token)
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

export const fetchTaskNodesByTaskId = createAsyncThunk(
  'task/fetchTaskNodesByTaskId',
  async ({ organizationId, projectId, taskId, token, page = 0, size = 20 }, thunkAPI) => {
    try {
      const response = await taskService.getTaskNodesByTaskId(organizationId, projectId, taskId, token, page, size)
      return response.data // this is an array of TaskNodes
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

export const fetchTaskEdgesByCriteria = createAsyncThunk(
  'task/fetchTaskEdgesByCriteria',
  async ({ organizationId, projectId, criteria, token, page = 0, size = 20 }, thunkAPI) => {
    try {
      // We can add pagination params in criteria if needed or ignore here
      const response = await taskService.getTaskEdgesByCriteria(organizationId, projectId, criteria, token)
      return response.data
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

export const deleteTaskNode = createAsyncThunk(
  'task/deleteTaskNode',
  async ({ organizationId, projectId, taskNodeId, token }, thunkAPI) => {
    try {
      await taskService.deleteTaskNode(organizationId, projectId, taskNodeId, token)
      return taskNodeId
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
      return taskId // return the taskId to remove it from the state
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
  taskNodesList: [],
  taskEdgesList: [],
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

      // update TaskNode
      .addCase(updateTaskNode.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateTaskNode.fulfilled, (state, action) => {
        state.isLoading = false
        // Update taskNodes dictionary and taskNodesList accordingly
        state.taskNodes[action.payload.id] = action.payload
        // Also update the taskNodesList array if present
        const idx = state.taskNodesList?.content?.findIndex(n => n.id === action.payload.id)
        if (idx !== -1) {
          state.taskNodesList.content[idx] = action.payload
        }
      })
      .addCase(updateTaskNode.rejected, (state, action) => {
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

      // Fetch TaskNodes by Task ID
      .addCase(fetchTaskNodesByTaskId.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTaskNodesByTaskId.fulfilled, (state, action) => {
        state.isLoading = false
        state.taskNodesList = action.payload // set the list of task nodes
      })
      .addCase(fetchTaskNodesByTaskId.rejected, (state, action) => {
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

      // Fetch TaskEdges by Criteria
      .addCase(fetchTaskEdgesByCriteria.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchTaskEdgesByCriteria.fulfilled, (state, action) => {
        state.isLoading = false
        state.taskEdgesList = action.payload // store the list of edges
      })
      .addCase(fetchTaskEdgesByCriteria.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Delete TaskNode and Conected Nodes and Edges
      .addCase(deleteTaskNode.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteTaskNode.fulfilled, (state, action) => {
        state.isLoading = false
        // Remove the deleted task node from taskNodesList.content (if exists)
        if (state.taskNodesList?.content) {
          state.taskNodesList.content = state.taskNodesList.content.filter(node => node.id !== action.payload)
        }
        // Also remove from taskNodes dictionary
        delete state.taskNodes[action.payload]
      })
      .addCase(deleteTaskNode.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // Delete Task
      .addCase(deleteTask.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isLoading = false
        // Remove the deleted task from projectTasks
        state.projectTasks = state.projectTasks.filter(task => task.id !== action.payload)
        // Optionally clear selectedTask if it was the deleted one
        if (state.selectedTask?.id === action.payload) {
          state.selectedTask = null
        }
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  }
})

export default taskSlice.reducer
