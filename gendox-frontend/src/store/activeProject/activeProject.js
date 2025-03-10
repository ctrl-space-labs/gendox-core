import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import projectService from 'src/gendox-sdk/projectService'
import documentService from 'src/gendox-sdk/documentService'
import organizationService from 'src/gendox-sdk/organizationService'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'

export const fetchProject = createAsyncThunk(
  'activeProject/fetchProject',
  async ({ organizationId, projectId, token }, thunkAPI) => {
    try {
      const projectPromise = projectService.getProjectById(organizationId, projectId, token)
      const membersPromise = projectService.getProjectMembers(organizationId, projectId, token)

      // Use Promise.all to wait for both promises to resolve
      const [projectData, membersData] = await Promise.all([projectPromise, membersPromise])

      // Return combined data
      return { project: projectData.data, members: membersData.data }
    } catch (error) {
      console.error('Failed to fetch project', error)
      return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)

export const fetchProjectDocuments = createAsyncThunk(
  'activeProject/fetchProjectDocuments',
  async ({ organizationId, projectId, token, page }, thunkAPI) => {
    try {
      const response = await documentService.getDocumentByProject(organizationId, projectId, token, page)
      return response.data
    } catch (error) {
      console.error('Failed to fetch project documents', error)
      return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)

export const updateProject = createAsyncThunk(
  'activeProject/updateProject',
  async ({ organizationId, projectId, updatedProjectPayload, token }, thunkAPI) => {
    try {
      const response = await projectService.updateProject(organizationId, projectId, updatedProjectPayload, token)
      return response.data
    } catch (error) {
      toast.error(`${getErrorMessage(error)}`)
      console.error('Failed to update project', error)
      return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)

export const deleteProject = createAsyncThunk(
  'activeProject/deleteProject',
  async ({ organizationId, projectId, token }, thunkAPI) => {
    try {
      const response = await projectService.deactivateProjectById(organizationId, projectId, token)
      return response.data
    } catch (error) {
      toast.error(`${getErrorMessage(error)}`)
      console.error('Failed to delete project', error)
      return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)

export const fetchProjectMembersAndRoles = createAsyncThunk(
  'activeProject/fetchProjectMembersAndRoles',
  async ({ organizationId, projectId, token }, thunkAPI) => {
    try {
      // 1. Fetch project members
      const membersResponse = await projectService.getProjectMembers(organizationId, projectId, token)
      const fetchedProjectMembers = membersResponse.data.map(user => ({
        ...user.user,
        userType: user.user.userType.name,
        activeProjectMember: true
      }))

      // 2. Fetch organization users (to get roles)
      const organizationResponse = await organizationService.getUsersInOrganizationByOrgId(organizationId, token)
      const organizationUsers = organizationResponse.data

      // 3. Update each project member with their role (if found)
      const updatedProjectMembers = fetchedProjectMembers.map(member => {
        const orgUser = organizationUsers.find(orgUser => orgUser.user.id === member.id)
        return {
          ...member,
          role: orgUser ? orgUser.role : null
        }
      })

      return updatedProjectMembers
    } catch (error) {
      toast.error(`${getErrorMessage(error)}`)
      console.error('Failed to fetch project members and roles', error)
      return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)

export const deleteProjectMember = createAsyncThunk(
  'activeProject/deleteProjectMember',
  async ({ organizationId, projectId, userId, token }, thunkAPI) => {
    try {
      await projectService.removeProjectMember(organizationId, projectId, userId, token)
      // Return the userId so we can filter it out of the Redux state
      return userId
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)

// Define the initial state
const initialActiveProjectState = {
  projectDetails: {},
  projectMembers: [],
  projectMembersAndRoles: [],
  projectDocuments: { content: [], totalPages: 0 },
  error: null,
  isUpdating: false,
  isDeleting: false,
  isBlurring: false,
  isMembersLoading: false,
  isDeletingMember: false
}

// Create the slice
const activeProjectSlice = createSlice({
  name: 'activeProject',
  initialState: initialActiveProjectState,
  reducers: {
    // standard reducer logic, with auto-generated action types per reducer
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProject.pending, state => {
        state.isBlurring = true
        state.error = null
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.isBlurring = false
        state.projectDetails = action.payload.project
        state.projectMembers = action.payload.members
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.isBlurring = false
        state.error = action.payload
      })

      .addCase(fetchProjectDocuments.pending, state => {
        state.isBlurring = true
        state.error = null
      })
      .addCase(fetchProjectDocuments.fulfilled, (state, action) => {
        state.isBlurring = false
        state.projectDocuments = action.payload
      })
      .addCase(fetchProjectDocuments.rejected, (state, action) => {
        state.isBlurring = false
        state.error = action.payload
      })
      .addCase(updateProject.pending, state => {
        state.isUpdating = true
        state.error = null
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isUpdating = false
        state.projectDetails = action.payload
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload
      })
    builder
      .addCase(deleteProject.pending, state => {
        state.isDeleting = true
        state.error = null
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isDeleting = false
        // Optionally, clear the project details or handle state update as needed
        state.projectDetails = {}
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isDeleting = false
        state.error = action.payload
      })
      .addCase(fetchProjectMembersAndRoles.pending, state => {
        state.isMembersLoading = true
        state.error = null
      })
      .addCase(fetchProjectMembersAndRoles.fulfilled, (state, action) => {
        state.isMembersLoading = false
        state.projectMembersAndRoles = action.payload
      })
      .addCase(fetchProjectMembersAndRoles.rejected, (state, action) => {
        state.isMembersLoading = false
        state.error = action.payload
      })
      .addCase(deleteProjectMember.pending, state => {
        state.isDeletingMember = true
        state.error = null
      })
      .addCase(deleteProjectMember.fulfilled, (state, action) => {
        state.isDeletingMember = false
        // Remove the member with id equal to action.payload
        state.projectMembers = state.projectMembers.filter(member => member.id !== action.payload)
      })
      .addCase(deleteProjectMember.rejected, (state, action) => {
        state.isDeletingMember = false
        state.error = action.payload
      })
  }
})

export const activeProjectActions = activeProjectSlice.actions
export default activeProjectSlice.reducer
