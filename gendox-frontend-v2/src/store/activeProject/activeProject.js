import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import projectService from 'src/gendox-sdk/projectService'
import invitationService from 'src/gendox-sdk/invitationService'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'
import { fetchOrganizationMembers } from 'src/store/activeOrganization/activeOrganization'

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
  },
  {
    // the guard and the agent pages both ask for the project in the URL as a page opens; one request answers both
    // (force: a reload after a change, which a request already on its way may predate)
    condition: ({ projectId, force }, { getState }) => force || getState().activeProject.loadingProjectId !== projectId
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
    // The organization's members go into the organization's store, which "Add from organization" reads, so they
    // load at the same time and on their own: a failure of the agent's members must not leave that list stale
    const organizationUsersPromise = thunkAPI.dispatch(fetchOrganizationMembers({ organizationId, token })).unwrap()
    organizationUsersPromise.catch(() => {}) // reported by its own request; awaited below when needed
    try {
      // 1. Fetch project members
      const membersResponse = await projectService.getProjectMembers(organizationId, projectId, token)
      const fetchedProjectMembers = membersResponse.data.map(user => ({
        ...user.user,
        userType: user.user.userType.name,
        activeProjectMember: true
      }))

      // 2. The organization's users, already on their way (for the roles)
      const organizationUsers = await organizationUsersPromise

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
      // a failure of the organization's members was already reported by their own request, and arrives unwrapped
      if (error?.response) toast.error(`${getErrorMessage(error)}`)
      console.error('Failed to fetch project members and roles', error)
      return thunkAPI.rejectWithValue(error?.response?.data ?? error)
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
      toast.error(`${getErrorMessage(error)}`)
      return thunkAPI.rejectWithValue(error.response.data)
    }
  }
)

export const fetchProjectInvitations = createAsyncThunk(
  'activeProject/fetchProjectInvitations',
  async ({ organizationId, projectId, token, params }, thunkAPI) => {
    try {
      const statusNames = Array.isArray(params?.statusNames) ? params.statusNames : null

      if (statusNames && statusNames.length > 0) {
        const requests = statusNames.map(statusName =>
          invitationService.getProjectInvitations(organizationId, projectId, token, { ...params, statusName })
        )
        const responses = await Promise.all(requests)
        const combined = responses.flatMap(r => (Array.isArray(r.data?.content) ? r.data.content : []))

        // Preserve duplicates by id only; allow multiple invitations per email.
        const byId = new Map()
        combined.forEach(inv => {
          if (inv?.id && !byId.has(inv.id)) byId.set(inv.id, inv)
        })

        return { content: Array.from(byId.values()) }
      }

      const response = await invitationService.getProjectInvitations(organizationId, projectId, token, params)
      return response.data
    } catch (error) {
      toast.error(`${getErrorMessage(error)}`)
      return thunkAPI.rejectWithValue(error.response?.data)
    }
  }
)

// Define the initial state
const initialActiveProjectState = {
  projectDetails: {},
  projectMembers: [],
  projectMembersAndRoles: [],
  projectInvitations: [],
  error: null,
  isUpdating: false,
  isDeleting: false,
  isBlurring: false,
  loadingProjectId: null,
  // the latest fetchProject's id: an earlier answer arriving after a later request (another agent) is dropped
  latestProjectRequest: null,
  isMembersLoading: false,
  isDeletingMember: false,
  isInvitationsLoading: false
}

// Create the slice
const activeProjectSlice = createSlice({
  name: 'activeProject',
  initialState: initialActiveProjectState,
  reducers: {
    // the project as a PUT returned it, so a save doesn't load it again
    setProjectDetails: (state, action) => {
      state.projectDetails = action.payload
      // a request for the same project still on its way predates the save; its answer must not undo it
      if (state.loadingProjectId === action.payload?.id) {
        state.latestProjectRequest = null
        state.loadingProjectId = null
        state.isBlurring = false
      }
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProject.pending, (state, action) => {
        state.isBlurring = true
        state.loadingProjectId = action.meta.arg.projectId
        state.latestProjectRequest = action.meta.requestId
        state.error = null
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestProjectRequest) return
        state.isBlurring = false
        state.loadingProjectId = null
        state.projectDetails = action.payload.project
        state.projectMembers = action.payload.members
      })
      .addCase(fetchProject.rejected, (state, action) => {
        if (action.meta.requestId !== state.latestProjectRequest) return
        state.isBlurring = false
        state.loadingProjectId = null
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
      .addCase(fetchProjectInvitations.pending, state => {
        state.isInvitationsLoading = true
        state.error = null
      })
      .addCase(fetchProjectInvitations.fulfilled, (state, action) => {
        state.isInvitationsLoading = false
        state.projectInvitations = action.payload
      })
      .addCase(fetchProjectInvitations.rejected, (state, action) => {
        state.isInvitationsLoading = false
        state.error = action.payload
      })
  }
})

export const activeProjectActions = activeProjectSlice.actions
export default activeProjectSlice.reducer
