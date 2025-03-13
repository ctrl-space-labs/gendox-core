import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import projectService from 'src/gendox-sdk/projectService'
import { generalConstants } from 'src/utils/generalConstants'
import chatConverter from '../../converters/chat.converter'
import chatThreadService from '../../gendox-sdk/chatThreadService'
import completionService from '../../gendox-sdk/completionService'

const initialChatState = {
  threads: null,
  agents: null,
  agentProfile: null,
  currentThread: null,
  isSendingMessage: false,
  threadId: null,
  currentMessageMetadata: null,
  isLoadingMessages: null,
  isLoadingAgentsAndThreads: null,
  isLoadingMetadata: null
}

/**
 * Thunk to fetch agents.
 * - Fetches projects from the API.
 * - Transforms each project into an agent.
 */
export const fetchAgents = createAsyncThunk(
  'gendoxChat/fetchAgents',
  async ({ organizationId, token }, { rejectWithValue }) => {
    try {
      // 1. Fetch projects for the organization.
      const projectsResponse = await projectService.getProjectsByOrganization(organizationId, token)
      const projects = projectsResponse.data.content

      // 2. Transform projects to agents.
      const agents = projects.map(project => {
        if (!project.projectAgent) {
          console.warn('Project has no projectAgent:', project)
          return {
            id: '',
            userId: '',
            agentId: '',
            projectId: project.id || '',
            fullName: 'Unknown Agent',
            role: 'Agent',
            description: project.description || ''
          }
        }
        return chatConverter.projectToAgent(project)
      })

      // 3. Return the transformed agents.
      return agents
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      return rejectWithValue(error.message)
    }
  }
)

/**
 * Thunk to fetch threads.
 * - Ensures agents are available (fetching them if needed).
 * - Extracts project IDs from the agents.
 * - Fetches threads and transforms them into thread entries.
 */
export const fetchThreads = createAsyncThunk(
  'gendoxChat/fetchThreads',
  async ({ organizationId, token }, { getState, dispatch, rejectWithValue }) => {
    try {
      // 1. Get agents from the Redux state.
      let agents = getState().gendoxChat.agents
      // If agents are not present, dispatch fetchAgents.
      if (!agents || agents.length === 0) {
        await dispatch(fetchAgents({ organizationId, token })).unwrap()
        agents = getState().gendoxChat.agents
      }

      // 2. Extract project IDs from the agents.
      const projectIds = agents.map(agent => agent.projectId)
      if (projectIds.length === 0) {
        // No projects means no threads to fetch.
        return []
      }

      // 3. For unauthenticated users, check for local thread IDs.
      let localThreadIds = null
      if (!token || token === generalConstants.NO_AUTH_TOKEN) {
        const localThreads = JSON.parse(localStorage.getItem(generalConstants.LOCAL_STORAGE_THREAD_IDS_NAME)) || []
        localThreadIds = localThreads.map(thread => thread.threadId)
      }

      // 4. Fetch threads based on the project IDs.
      const threadsResponse = await chatThreadService.getThreadsByCriteria(projectIds, localThreadIds, token)
      const threads = threadsResponse.data.content

      // 5. Transform threads into UI-friendly thread entries using the agents.
      const threadEntries = threads.map(thread => chatConverter.gendoxThreadToThreadEntry(thread, agents))

      // 6. Sort the thread entries (for example, by last message time descending).
      threadEntries.sort((a, b) => new Date(b.latestMessageCreatedAt) - new Date(a.latestMessageCreatedAt))

      return threadEntries
    } catch (error) {
      console.error('Failed to fetch threads:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const loadThread = createAsyncThunk(
  'gendoxChat/loadThread',
  async ({ threadId, projectId, organizationId, token }, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState()
      let newThread = !threadId
      if (newThread) {
        return _createNewThread(state, projectId, organizationId)
      }

      let currentThread = await _fetchExistingThreadWithMessages(
        threadId,
        projectId,
        organizationId,
        dispatch,
        token,
        state
      )

      return currentThread
    } catch (error) {
      console.error('Failed to load thread:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const fetchMessageMetadata = createAsyncThunk(
  'gendoxChat/fetchMessageMetadata',
  async ({ thread, message, token }, { rejectWithValue }) => {
    try {
      const response = await chatThreadService.getThreadMessageMetadataByMessageId(thread.id, message.messageId, token)
      return response.data
    } catch (error) {
      console.error('Failed to fetch message metadata:', error)
      return rejectWithValue(error.message)
    }
  }
)

export const sendMessage = createAsyncThunk(
  'gendoxChat/sendMessage',
  async (
    { user, currentThread, message, organizationId, iFrameMessageManager, token },
    { getState, dispatch, rejectWithValue }
  ) => {
    if (!user?.id) {
      throw new Error('User is missing or invalid')
    }

    // the threadId is null for new threads, this is expected
    const threadId = currentThread.threadId
    const projectId = currentThread.agent.projectId
    const agentId = currentThread.agent.agentId

    dispatch(
      addMessage({
        createdBy: user.id,
        text: message,
        createdAt: new Date()
      })
    )

    // sending PostMessage notification
    iFrameMessageManager.messageManager.sendMessage({
      type: 'gendox.events.chat.message.new.sent',
      payload: { message }
    })

    let chatLocalContextResponses = await iFrameMessageManager.messageManager.fetchResponses(
      'gendox.events.chat.message.context.local.request',
      'gendox.events.chat.message.context.local.response',
      {},
      1,
      200
    )

    // Send the message to the server
    const response = await completionService.postCompletionMessage(
      projectId,
      threadId,
      message,
      chatLocalContextResponses,
      token
    )

    // sending PostMessage notification
    iFrameMessageManager.messageManager.sendMessage({
      type: 'gendox.events.chat.message.new.response.received',
      payload: response.data.message.value
    })

    const { id, value, messageSections, threadId: responseThreadId, createdAt: createdAt } = response.data.message

    dispatch(
      addMessage({
        id,
        text: value,
        sections: messageSections,
        time: createdAt,
        createdBy: agentId,
        createdAt
      })
    )

    const isNewThread = !threadId
    const finalThreadId = isNewThread ? responseThreadId : threadId

    if (isNewThread) {
      _updateThreadsToLocalStorage(responseThreadId)
    }

    //reload threads to get the updated one
    // TODO requires performance improvement
    dispatch(fetchThreads({ organizationId, token }))

    if (isNewThread) {
      // TODO this should change the URL in the browser, fix in the future
      dispatch(loadThread({ threadId: finalThreadId, projectId, organizationId, token }))
    }

  }
)

export const addMessage = createAsyncThunk('gendoxChat/pushMessage', async (message, { dispatch, getState }) => {
  return {
    messageId: message.id,
    message: message.text,
    sections: message.sections,
    createdAt: message.createdAt,
    createdBy: message.createdBy
  }
})

export const fetchThreadId = createAsyncThunk('gendoxChat/fetchThreadId', async (arg, thunkAPI) => {
  console.log('fetchThreadId called')
})

const gendoxChatSlice = createSlice({
  name: 'gendoxChat',
  initialState: initialChatState,
  reducers: {
    resetChatState: state => {
      state.threads = null
      state.agents = null
      state.currentThread = null
      state.agentProfile = null
      state.isSendingMessage = false
      state.threadId = null
      state.currentMessageMetadata = null
      state.isLoadingMessages = null
      state.isLoadingAgentsAndThreads = null
      state.isLoadingMetadata = null
    },
    removeCurrentThread: state => {
      state.currentThread = null
    },
    updateCurrentThreadWithAgent: state => {
      if (!state.currentThread) {
        return
      }
      const { projectId } = state.currentThread
      const foundAgent = state.agents?.find(agent => agent.projectId === projectId)
      if (foundAgent) {
        state.currentThread.agent = foundAgent
      }
    },

    updateCurrentThreadWithThreadObj: state => {
      if (!state.currentThread) return
      const { threadId } = state.currentThread
      const foundThread = state.threads?.find(thread => thread.id === threadId)
      if (foundThread) {
        state.currentThread.thread = foundThread
      }
    },
    setUserProfile: (state, action) => {
      state.agentProfile = chatConverters.toChatAgentProfile(action.payload)
    },
    clearCurrentMessageMetadata: state => {
      state.currentMessageMetadata = ''
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchAgents.fulfilled, (state, action) => {
      state.agents = action.payload
    })
    builder.addCase(fetchAgents.pending, (state, action) => {})
    builder.addCase(fetchAgents.rejected, (state, action) => {})
    builder.addCase(fetchThreads.fulfilled, (state, action) => {
      state.threads = action.payload
      state.isLoadingAgentsAndThreads = false
    })
    builder.addCase(fetchThreads.pending, (state, action) => {
      state.isLoadingAgentsAndThreads = true
    })
    builder.addCase(fetchThreads.rejected, (state, action) => {
      state.isLoadingAgentsAndThreads = false
    })
    builder.addCase(loadThread.pending, (state, action) => {
      // if (!action.meta.arg.keepChatContent) {
      //   state.isSending = false;
      //   state.currentThread = null;
      // }
      state.currentThread = null
      state.isLoadingMessages = true
    })
    builder.addCase(loadThread.fulfilled, (state, action) => {
      state.currentThread = action.payload
      state.isLoadingMessages = false
    })
    builder.addCase(loadThread.rejected, (state, action) => {
      state.currentThread = null
      state.isLoadingMessages = false
    })
    builder.addCase(fetchMessageMetadata.pending, (state, action) => {
      // Access the arguments passed to the thunk
      const { thread, message } = action.meta.arg

      state.currentMessageMetadata = {
        isFetching: true,
        metadata: null,
        thread,
        message
      }
      state.isLoadingMetadata = true
    })
    builder.addCase(fetchMessageMetadata.fulfilled, (state, action) => {
      // Access the arguments passed to the thunk
      const { thread, message } = action.meta.arg

      state.currentMessageMetadata = {
        isFetching: false,
        metadata: action.payload,
        thread,
        message
      }
      state.isLoadingMetadata = false
    })
    builder.addCase(fetchMessageMetadata.rejected, (state, action) => {
      state.currentMessageMetadata = null
      state.isLoadingMetadata = false
    })
    builder.addCase(sendMessage.pending, state => {
      state.isSendingMessage = true // Set isSending to true when sendMessage starts
    })
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.isSendingMessage = false // Set isSending to false on success
    })
    builder.addCase(sendMessage.rejected, state => {
      state.isSendingMessage = false // Ensure isSending is false on failure
    })
    builder.addCase(addMessage.fulfilled, (state, action) => {
      if (state.currentThread && state.currentThread.messages) {
        state.currentThread.messages = [...state.currentThread.messages, action.payload]
      }
    })
    builder.addCase(fetchThreadId.fulfilled, (state, action) => {
      state.threadId = action.payload // Store the fetched threadId in the Redux state
    })
  }
})

function _createNewThread(state, projectId, organizationId) {
  let newThreadChat = {
    id: null,
    threadId: null,
    projectId: projectId,
    organizationId: organizationId,
    thread: null,
    agent: null,
    messages: []
  }
  return newThreadChat
}

async function _fetchExistingThreadWithMessages(threadId, projectId, organizationId, dispatch, token, state) {
  const messagesResponse = await chatThreadService.getThreadMessagesByCriteria(threadId, token)

  let chatMessages = messagesResponse.data.content.map(message => chatConverter.gendoxMessageToThreadMessage(message))

  // sort messages by time ascending
  chatMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  let currentThread = {
    id: threadId,
    threadId: threadId,
    projectId: projectId,
    organizationId: organizationId,
    thread: null,
    agent: null,
    messages: chatMessages
  }

  return currentThread
}

export const chatActions = gendoxChatSlice.actions

export default gendoxChatSlice.reducer

/**
 * Update the threads in localStorage by removing the old ones and adding the new one
 *
 * @param newThreadId
 * @private
 */
function _updateThreadsToLocalStorage(newThreadId) {
  // Retrieve the existing array from localStorage
  let threads = JSON.parse(localStorage.getItem(generalConstants.LOCAL_STORAGE_THREAD_IDS_NAME)) || []

  // remove threads older than 2 weeks old
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  threads = threads.filter(thread => new Date(thread.createdAt) > twoWeeksAgo)

  // Push the newThreadId to the array
  threads.push({
    threadId: newThreadId,
    createdAt: new Date().toISOString()
  })

  // Save the updated array back to localStorage
  localStorage.setItem(generalConstants.LOCAL_STORAGE_THREAD_IDS_NAME, JSON.stringify(threads))
}
