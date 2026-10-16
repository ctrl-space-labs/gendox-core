import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import searchService from 'src/gendox-sdk/searchService'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'

// 1. Fetch closer sections from the backend
export const fetchCloserSectionsFromProject = createAsyncThunk(
  'globalSearch/fetchCloserSectionsFromProject',
  async ({ message, projectId, size, page, token }) => {
    try {
      const response = await searchService.postSearchMessage(message, projectId, size, page, token)
      return response.data
    } catch (error) {
      toast.error(`Failed to fetch closer sections from the project. Error: ${getErrorMessage(error)}`)
      return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)

const globalSearchSlice = createSlice({
  name: 'globalSearch',
  initialState: {
    closerDocumentsFromProject: [],
    loading: false,
    error: null
  },
  reducers: {
    resetCloserDocuments: state => {
      state.closerDocumentsFromProject = []
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCloserSectionsFromProject.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCloserSectionsFromProject.fulfilled, (state, action) => {
        state.loading = false
        state.closerDocumentsFromProject = action.payload
      })
      .addCase(fetchCloserSectionsFromProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
  }
})

export const { resetCloserDocuments } = globalSearchSlice.actions

export default globalSearchSlice.reducer
