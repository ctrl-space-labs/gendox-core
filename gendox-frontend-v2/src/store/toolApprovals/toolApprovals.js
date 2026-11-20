import { createSlice } from '@reduxjs/toolkit'

// Tool calls waiting for the user's yes or no. One list for every kind of approval: a command
// on this computer today, and tools an admin marks "ask first" once the server supports it
// (APPR-1, APPR-2). Each request is plain data; the promise that waits for the answer is kept by
// ToolApprovalsProvider.
//
// A request: { id, kind: 'command' | 'folder', threadId, title?, description, command?, directory?, retry? }

const toolApprovalsSlice = createSlice({
  name: 'toolApprovals',
  initialState: {
    pending: []
  },
  reducers: {
    approvalRequested: (state, action) => {
      state.pending = state.pending.filter(request => request.id !== action.payload.id)
      state.pending.push(action.payload)
    },
    approvalSettled: (state, action) => {
      state.pending = state.pending.filter(request => request.id !== action.payload)
    }
  }
})

export const { approvalRequested, approvalSettled } = toolApprovalsSlice.actions

export default toolApprovalsSlice.reducer
