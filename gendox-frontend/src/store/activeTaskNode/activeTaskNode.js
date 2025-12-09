import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'
import { fetchDocumentsByCriteria } from '../activeDocument/activeDocument'

// -------- Thunks for TaskNodes --------

export const createTaskNode = createAsyncThunk(
  'taskNode/createTaskNode',
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

export const createTaskNodesBatch = createAsyncThunk(
  'taskNode/createBatch',
  async ({ organizationId, projectId, taskNodesPayload, token }, thunkAPI) => {
    try {
      const response = await taskService.createTaskNodesBatch(organizationId, projectId, taskNodesPayload, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const updateTaskNode = createAsyncThunk(
  'taskNode/update',
  async ({ organizationId, projectId, taskId, taskNodePayload, token }, thunkAPI) => {
    try {
      const response = await taskService.updateTaskNode(organizationId, projectId, taskId, taskNodePayload, token)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const fetchTaskNodeById = createAsyncThunk(
  'taskNode/fetchById',
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
  'taskNode/fetchByTask',
  async ({ organizationId, projectId, taskId, token, page = 0, size = 20 }, thunkAPI) => {
    try {
      const response = await taskService.getTaskNodesByTaskId(organizationId, projectId, taskId, token, page, size)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const fetchTaskNodesByCriteria = createAsyncThunk(
  'taskNode/fetchByCriteria',
  async ({ organizationId, projectId, taskId, criteria, token, page = 0, size = 20 }, thunkAPI) => {
    try {
      const response = await taskService.getTaskNodesByCriteria(
        organizationId,
        projectId,
        taskId,
        criteria,
        token,
        page,
        size
      )
      return {
        content: response.data.content,
        totalElements: response.data.totalElements,
        page: response.data.pageable.pageNumber,
        size: response.data.pageable.pageSize
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const fetchAnswerTaskNodes = createAsyncThunk(
  'taskNode/fetchAnswerTaskNodes',
  async ({ organizationId, projectId, taskId, answerTaskNodePayload, token, page = 0, size = 20 }, thunkAPI) => {
    try {
      const response = await taskService.getAnswerTaskNodes(
        organizationId,
        projectId,
        taskId,
        answerTaskNodePayload,
        token,
        page,
        size
      )
      return {
        content: response.data.content,
        totalElements: response.data.totalElements,
        page: response.data.pageable.pageNumber,
        size: response.data.pageable.pageSize
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const fetchDocumentPages = createAsyncThunk(
  'taskNode/fetchDocumentPages',
  async ({ organizationId, projectId, taskId, token, page = 0, size = 20 }, thunkAPI) => {
    try {
      const response = await taskService.getDocumentPages(organizationId, projectId, taskId, token, page, size)
      return response.data
    } catch (error) {
      toast.error(getErrorMessage(error))
      return thunkAPI.rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const deleteTaskNode = createAsyncThunk(
  'taskNode/delete',
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

export const loadTaskData = createAsyncThunk(
  'taskNode/loadTaskData',
  async ({ organizationId, projectId, taskId, token, docsPage, docsPageSize }, thunkAPI) => {
    try {
      //
      // 1️⃣ Fetch DOCUMENT task nodes
      //
      const docsResult = await thunkAPI
        .dispatch(
          fetchTaskNodesByCriteria({
            organizationId,
            projectId,
            taskId,
            token,
            criteria: { taskId, nodeTypeNames: ['DOCUMENT'] },
            page: docsPage,
            size: docsPageSize
          })
        )
        .unwrap()

      const documentNodes = docsResult.content || []
      const documentIds = documentNodes.map(n => n.documentId).filter(Boolean)

      //
      // 2️⃣ Fetch full documents
      //
      if (documentIds.length > 0) {
        await thunkAPI
          .dispatch(
            fetchDocumentsByCriteria({
              organizationId,
              projectId,
              documentIds,
              token
            })
          )
          .unwrap()
      }
      const fullDocs = thunkAPI.getState().activeDocument.documents

      const mergedDocumentNodes = documentNodes.map(node => {
        const full = fullDocs.find(d => d.id === node.documentId)
        return {
          ...node,
          nodeValue: {
            ...node.nodeValue,
            documentMetadata: {
              ...(node.nodeValue?.documentMetadata || {}),
              title: full?.title,
              remoteUrl: full?.remoteUrl,
              prompt: node.nodeValue?.documentMetadata?.prompt || '',
              supportingDocumentIds: node.nodeValue?.documentMetadata?.supportingDocumentIds || []
            }
          }
        }
      })
      thunkAPI.dispatch({
        type: 'taskNode/updateMergedDocuments',
        payload: mergedDocumentNodes
      })

      //
      // 3️⃣ Fetch QUESTION task nodes
      //
      const questionsResult = await thunkAPI
        .dispatch(
          fetchTaskNodesByCriteria({
            organizationId,
            projectId,
            taskId,
            token,
            criteria: { taskId, nodeTypeNames: ['QUESTION'] },
            page: 0,
            size: 2147483647 // max int to fetch all questions
          })
        )
        .unwrap()

      const questionNodes = questionsResult.content || []

      //
      // 4️⃣ Fetch ANSWER task nodes (depends on docs + questions)
      //
      const answerPayload = {
        documentNodeIds: documentNodes.map(d => d.id),
        questionNodeIds: questionNodes.map(q => q.id)
      }

      await thunkAPI
        .dispatch(
          fetchAnswerTaskNodes({
            organizationId,
            projectId,
            taskId,
            answerTaskNodePayload: answerPayload,
            token,
            page: 0,
            size: 2147483647 // max int to fetch all answers
          })
        )
        .unwrap()

      return true
    } catch (error) {
      toast.error('Failed to load task data.')
      return thunkAPI.rejectWithValue(error)
    }
  }
)

// -------- State --------

const initialState = {
  taskNodes: {},
  taskNodesList: [],
  taskNodesDocumentList: [],
  taskNodesQuestionList: [],
  taskNodesAnswerList: [],
  taskNodesRestList: [],
  taskDocumentPages: [],
  isLoading: false,
  isLoadingAnswers: false,
  error: null
}

const taskNodeSlice = createSlice({
  name: 'taskNode',
  initialState,
  reducers: {
    updateMergedDocuments(state, action) {
      state.taskNodesDocumentList = {
        ...state.taskNodesDocumentList,
        content: action.payload
      }
    }
  },
  extraReducers: builder => {
    builder
      // create / update / fetch single node
      .addCase(createTaskNode.fulfilled, (state, action) => {
        state.taskNodes[action.payload.id] = action.payload
      })
      .addCase(createTaskNodesBatch.fulfilled, (state, action) => {
        action.payload.forEach(node => {
          state.taskNodes[node.id] = node
        })
      })
      .addCase(updateTaskNode.fulfilled, (state, action) => {
        state.taskNodes[action.payload.id] = action.payload
      })
      .addCase(fetchTaskNodeById.fulfilled, (state, action) => {
        state.taskNodes[action.payload.id] = action.payload
      })

      // list by taskId
      .addCase(fetchTaskNodesByTaskId.fulfilled, (state, action) => {
        state.taskNodesList = action.payload
      })

      // by criteria: DOCUMENT / QUESTION / ANSWER / OTHER
      .addCase(fetchTaskNodesByCriteria.pending, (state, action) => {
        const { criteria } = action.meta.arg
        if (criteria.nodeTypeNames?.includes('ANSWER')) {
          state.isLoadingAnswers = true
        } else {
          state.isLoading = true
        }
        state.error = null
      })
      .addCase(fetchTaskNodesByCriteria.fulfilled, (state, action) => {
        const { criteria } = action.meta.arg

        if (criteria.nodeTypeNames?.includes('ANSWER')) {
          state.isLoadingAnswers = false
          state.taskNodesAnswerList = action.payload
        }
        if (criteria.nodeTypeNames?.includes('DOCUMENT')) {
          state.isLoading = false
          state.taskNodesDocumentList = action.payload
        }
        if (criteria.nodeTypeNames?.includes('QUESTION')) {
          state.isLoading = false
          state.taskNodesQuestionList = action.payload
        }
        if (
          !criteria.nodeTypeNames ||
          (!criteria.nodeTypeNames.includes('ANSWER') &&
            !criteria.nodeTypeNames.includes('DOCUMENT') &&
            !criteria.nodeTypeNames.includes('QUESTION'))
        ) {
          state.isLoading = false
          state.taskNodesRestList = action.payload
        }
      })
      .addCase(fetchTaskNodesByCriteria.rejected, (state, action) => {
        const { criteria } = action.meta.arg
        if (criteria.nodeTypeNames?.includes('ANSWER')) {
          state.isLoadingAnswers = false
        } else {
          state.isLoading = false
        }
        state.error = action.payload
      })

      // explicit fetch answers
      .addCase(fetchAnswerTaskNodes.pending, state => {
        state.isLoadingAnswers = true
        state.error = null
      })
      .addCase(fetchAnswerTaskNodes.fulfilled, (state, action) => {
        state.isLoadingAnswers = false
        state.taskNodesAnswerList = action.payload
      })
      .addCase(fetchAnswerTaskNodes.rejected, (state, action) => {
        state.isLoadingAnswers = false
        state.error = action.payload
      })

      // document pages
      .addCase(fetchDocumentPages.pending, state => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDocumentPages.fulfilled, (state, action) => {
        state.isLoading = false
        state.taskDocumentPages = action.payload
      })
      .addCase(fetchDocumentPages.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // delete node
      .addCase(deleteTaskNode.fulfilled, (state, action) => {
        delete state.taskNodes[action.payload]
        if (state.taskNodesList?.content) {
          state.taskNodesList.content = state.taskNodesList.content.filter(n => n.id !== action.payload)
        }
      })
  }
})

export default taskNodeSlice.reducer
