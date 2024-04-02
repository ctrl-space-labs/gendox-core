import { createSlice } from '@reduxjs/toolkit'

const initialActiveProjectState = { activeProject: null }

const ActiveProjectSlice = createSlice({
  name: 'activeProject',
  initialState: initialActiveProjectState,
  reducers: {
    getActiveProject(state, action) {
      state.activeProject = action.payload
    }
  }
})

export const activeProjectActions = ActiveProjectSlice.actions

export default ActiveProjectSlice.reducer








// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

// // ** Axios Imports
// import axios from 'axios'

// import authConfig from 'src/configs/auth';
// import apiRequests from 'src/configs/apiRequest';

// // ** Fetch Active Project
// export const fetchActiveProject = createAsyncThunk('activeProject/fetchActiveProject',
//   async ({ organizationId, projectId }, { rejectWithValue }) => {
//     try {
//       const storedToken = window.localStorage.getItem(authConfig.storageTokenKeyName);
//       if (!storedToken) {
//         throw new Error('No authentication token available.');
//       }

//       const response = await axios.get(apiRequests.getProjectById(organizationId.id, projectId.id),      {
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${storedToken}`,
//         },
//       });
//       console.log("*****************", response.data)

//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response ? error.response.data : 'An error occurred');
//     }
//   }
// );

// const ActiveProjectSlice = createSlice({
//   name: 'activeProject',
//   initialState: {
//     activeProject: null,
//     status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
//     error: null
//   },
//   reducers: {
//     getActiveProject(state, action) {
//       state.activeOrganization = fetchActiveProject(action.organizationId, action.projectId)
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchActiveProject.pending, (state) => {
//         state.status = 'loading';
//       })
//       .addCase(fetchActiveProject.fulfilled, (state, action) => {
//         state.status = 'succeeded';
//         state.activeProject = action.payload;
//       })
//       .addCase(fetchActiveProject.rejected, (state, action) => {
//         state.status = 'failed';
//         state.error = action.payload;
//       });
//   },
// });

// export const activeProjectActions = ActiveProjectSlice.actions

// export default ActiveProjectSlice.reducer
