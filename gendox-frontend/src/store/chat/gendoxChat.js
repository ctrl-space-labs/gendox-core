import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import projectService from 'src/gendox-sdk/projectService'
import taskService from 'src/gendox-sdk/taskService'
import { generalConstants } from 'src/utils/generalConstants'
import { getErrorMessage } from 'src/utils/errorHandler'
import { toast } from 'sonner'
import chatConverter from '../../converters/chat.converter'
import chatThreadService from '../../gendox-sdk/chatThreadService'
import completionService from '../../gendox-sdk/completionService'
import documentService from '../../gendox-sdk/documentService'
import { updateSessionThreadId } from 'src/utils/embeddedChatSession'

const DEFAULT_LOCAL_CONTEXT_MAX_RESPONSES = 0 // basically dont wait
const DEFAULT_LOCAL_CONTEXT_MAX_WAIT_MS = 10

const resolveLocalContextFetchConfig = iFrameMessageManager => {
  const config = iFrameMessageManager?.iFrameConfiguration || {}
  return {
    maxResponses: config.localContextMaxResponses ?? DEFAULT_LOCAL_CONTEXT_MAX_RESPONSES,
    maxWaitTimeoutMs: config.localContextMaxWaitMs ?? DEFAULT_LOCAL_CONTEXT_MAX_WAIT_MS
  }
}

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
  isLoadingMetadata: null,
  isDeepThinking: false,
  deepThinkingJobId: null,
  deepThinkingSteps: [],
  newlyCreatedThreadId: null
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
      toast.error(`Failed to fetch agents. Error: ${getErrorMessage(error)}`)
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
      toast.error(`Failed to fetch threads. Error: ${getErrorMessage(error)}`)
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

      // If the threadId is the same as the current threadId, return the current thread
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
      toast.error(`Failed to load thread. Error: ${getErrorMessage(error)}`)
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
      toast.error(`Failed to fetch message metadata. Error: ${getErrorMessage(error)}`)
      return rejectWithValue(error.message)
    }
  }
)

export const sendMessage = createAsyncThunk(
  'gendoxChat/sendMessage',
  async (
    { user, currentThread, message, uploadedDocs = [], organizationId, iFrameMessageManager, token },
    { getState, dispatch, rejectWithValue }
  ) => {
    if (!user?.id) {
      throw new Error('User is missing or invalid')
    }

    // the threadId is null for new threads, this is expected
    const threadId = currentThread.threadId
    const projectId = currentThread.agent.projectId
    dispatch(
      addMessage({
        createdBy: user.id,
        value: message,
        createdAt: new Date().toISOString(),
        attachments: uploadedDocs
      })
    )

    // sending PostMessage notification
    iFrameMessageManager.messageManager.sendMessage({
      type: 'gendox.events.chat.message.new.sent',
      payload: { message }
    })

    const { maxResponses, maxWaitTimeoutMs } = resolveLocalContextFetchConfig(iFrameMessageManager)
    let chatLocalContextResponses = await iFrameMessageManager.messageManager.fetchResponses(
      'gendox.events.chat.message.context.local.request',
      'gendox.events.chat.message.context.local.response',
      {},
      maxResponses,
      maxWaitTimeoutMs
    )

    const documentInstanceIds = (uploadedDocs || []).map(d => d?.documentId).filter(Boolean)

    const deepThinking = currentThread.deepThinking || false

    // Send the message to the server
    const response = await completionService.postCompletionMessage(
      projectId,
      threadId,
      message,
      chatLocalContextResponses,
      documentInstanceIds,
      token,
      deepThinking
    )

    // Deep thinking returns HTTP 202 with { jobExecutionId, threadId }
    if (response.status === 202 && response.data?.jobExecutionId) {
      const { jobExecutionId, threadId: responseThreadId } = response.data

      const { finalThreadId } = await _handleThreadPostSend({
        threadId,
        responseThreadId,
        projectId,
        organizationId,
        token,
        dispatch
      })

      return { deepThinking: true, jobExecutionId, threadId: finalThreadId, isNewThread: !threadId }
    }

    const { messages: apiMessages = [], threadId: responseThreadId } = response.data
    _dispatchIncomingMessagesAndToolCalls({
      apiMessages,
      responseThreadId,
      dispatch,
      iFrameMessageManager,
      sessionContext: {
        isEmbedded: iFrameMessageManager?.isEmbedded,
        originUrl: iFrameMessageManager?.originUrl,
        organizationId,
        projectId
      }
    })

    const { finalThreadId } = await _handleThreadPostSend({
      threadId,
      responseThreadId,
      projectId,
      organizationId,
      token,
      dispatch
    })

    return { deepThinking: false, threadId: finalThreadId, isNewThread: !threadId }
  }
)

export const pollDeepThinkingStatus = createAsyncThunk(
  'gendoxChat/pollDeepThinkingStatus',
  async ({ organizationId, projectId, jobExecutionId, token }, { rejectWithValue }) => {
    try {
      const [jobResponse, stepsResponse] = await Promise.all([
        taskService.getJobsByCriteria(organizationId, projectId, { jobExecutionIdsIn: [jobExecutionId] }, token),
        taskService.getDeepThinkingSteps(organizationId, projectId, jobExecutionId, token)
      ])

      const job = jobResponse.data?.content?.[0]
      const rawStatus = job?.status?.trim().toUpperCase()
      const exitCode = job?.exitCode?.trim().toUpperCase()

      // Spring Batch can sometimes report status=UNKNOWN even when exitCode is terminal (e.g. FAILED).
      // Derive a more reliable effective status for UI polling/termination decisions.
      const status =
        rawStatus && rawStatus !== 'UNKNOWN'
          ? rawStatus
          : exitCode && ['COMPLETED', 'FAILED', 'STOPPED', 'ABANDONED', 'UNKNOWN'].includes(exitCode)
            ? exitCode
            : rawStatus
      const steps = stepsResponse.data || []

      return { status, steps, job }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const finalizeDeepThinkingThread = createAsyncThunk(
  'gendoxChat/finalizeDeepThinkingThread',
  async ({ threadId, token, iFrameMessageManager }, { getState, dispatch, rejectWithValue }) => {
    try {
      if (!threadId) return { addedCount: 0 }

      const response = await chatThreadService.getThreadMessagesByCriteria(threadId, token)
      const apiMessages = response?.data?.content || []
      const existingMessages = getState()?.gendoxChat?.currentThread?.messages || []
      const existingMessageIds = new Set(existingMessages.map(m => m?.messageId).filter(Boolean))

      const newApiMessages = apiMessages
        .filter(message => {
          const messageId = message?.id
          const role = (message?.role || '').toUpperCase()
          if (!messageId) return false
          if (existingMessageIds.has(messageId)) return false
          // User message was already added optimistically on send.
          if (role === 'USER') return false
          return true
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

      const currentThread = getState()?.gendoxChat?.currentThread
      _dispatchIncomingMessagesAndToolCalls({
        apiMessages: newApiMessages,
        responseThreadId: threadId,
        dispatch,
        iFrameMessageManager,
        sessionContext: {
          isEmbedded: iFrameMessageManager?.isEmbedded,
          originUrl: iFrameMessageManager?.originUrl,
          organizationId: currentThread?.organizationId,
          projectId: currentThread?.projectId
        }
      })

      return { addedCount: newApiMessages.length }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const cancelDeepThinking = createAsyncThunk(
  'gendoxChat/cancelDeepThinking',
  async ({ organizationId, projectId, jobExecutionId, token }, { rejectWithValue }) => {
    try {
      await taskService.stopJob(organizationId, projectId, jobExecutionId, token)
      return { jobExecutionId }
    } catch (error) {
      const errorCode = error?.response?.data?.errorCode || error?.response?.data?.code
      // These mean there is no cancellable execution in this context anymore.
      // Treat them as terminal so UI state/polling can be cleared safely.
      if (errorCode === 'JOB_EXECUTION_NOT_FOUND' || errorCode === 'JOB_PROJECT_MISMATCH') {
        return { jobExecutionId, ignoredErrorCode: errorCode }
      }
      return rejectWithValue(error.message)
    }
  }
)

export const resumeDeepThinkingIfActive = createAsyncThunk(
  'gendoxChat/resumeDeepThinkingIfActive',
  async ({ organizationId, projectId, token }, { dispatch, rejectWithValue }) => {
    try {
      const jobId = localStorage.getItem('activeDeepThinkingJobId')
      if (!jobId) return null

      const jobResponse = await taskService.getJobsByCriteria(
        organizationId,
        projectId,
        { jobExecutionIdsIn: [jobId] },
        token
      )

      const job = jobResponse.data?.content?.[0]
      const status = job?.status?.trim().toUpperCase()

      if (status === 'STARTED' || status === 'STARTING') {
        return { jobExecutionId: Number(jobId), status }
      }

      localStorage.removeItem('activeDeepThinkingJobId')
      localStorage.removeItem('activeDeepThinkingThreadId')
      return null
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const addMessage = createAsyncThunk('gendoxChat/pushMessage', async (message, { dispatch, getState }) => {
  return chatConverter.gendoxMessageToThreadMessage(message)
})

export const fetchThreadId = createAsyncThunk('gendoxChat/fetchThreadId', async (arg, thunkAPI) => {})

export const hydrateAttachmentPreviews = createAsyncThunk(
  'gendoxChat/hydrateAttachmentPreviews',
  async ({ threadId, token, messages }, { dispatch }) => {
    if (!Array.isArray(messages) || messages.length === 0) return

    const isImageAttachment = a => {
      const ft = (a?.fileType?.name || '').toLowerCase()
      const title = (a?.title || '').toLowerCase()
      return (
        ft.includes('image') ||
        title.endsWith('.png') ||
        title.endsWith('.jpg') ||
        title.endsWith('.jpeg') ||
        title.endsWith('.gif') ||
        title.endsWith('.webp')
      )
    }

    const queue = []
    const msgs = [...messages].reverse()

    for (const m of msgs) {
      const atts = Array.isArray(m.attachments) ? m.attachments : []
      for (const a of atts) {
        if (!a?.documentId) continue
        if (!isImageAttachment(a)) continue
        if (a.previewUrl) continue
        queue.push({ messageId: m.messageId, documentId: a.documentId })
      }
    }

    const CONCURRENCY = 3
    let idx = 0

    const worker = async () => {
      while (idx < queue.length) {
        const item = queue[idx++]

        dispatch(
          chatActions.setAttachmentPreviewStatus({
            messageId: item.messageId,
            documentId: item.documentId,
            previewStatus: 'loading'
          })
        )

        try {
          const res = await documentService.viewDocumentContent(threadId, item.documentId, token)
          const blobUrl = URL.createObjectURL(res.data)

          dispatch(
            chatActions.setAttachmentPreview({
              messageId: item.messageId,
              documentId: item.documentId,
              previewUrl: blobUrl
            })
          )
        } catch (e) {
          dispatch(
            chatActions.setAttachmentPreviewStatus({
              messageId: item.messageId,
              documentId: item.documentId,
              previewStatus: 'error'
            })
          )
        }
      }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  }
)


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
      state.isDeepThinking = false
      state.deepThinkingJobId = null
      state.deepThinkingSteps = []
      state.newlyCreatedThreadId = null
    },
    clearDeepThinkingState: state => {
      state.isDeepThinking = false
      state.deepThinkingJobId = null
      state.deepThinkingSteps = []
      try {
        localStorage.removeItem('activeDeepThinkingJobId')
        localStorage.removeItem('activeDeepThinkingThreadId')
      } catch (_) {}
    },
    removeCurrentThread: state => {
      const revokeThreadPreviewUrls = thread => {
        const msgs = thread?.messages || []
        msgs.forEach(m => {
          const atts = m?.attachments || []
          atts.forEach(a => {
            if (a?.previewUrl) URL.revokeObjectURL(a.previewUrl)
          })
        })
      }
      revokeThreadPreviewUrls(state.currentThread)
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
    },
    clearNewlyCreatedThreadId: state => {
      state.newlyCreatedThreadId = null
    },
    setAttachmentPreviewStatus: (state, action) => {
      const { messageId, documentId, previewStatus } = action.payload
      const msgs = state.currentThread?.messages || []
      const msg = msgs.find(m => m.messageId === messageId)
      if (!msg) return
      const att = (msg.attachments || []).find(a => a.documentId === documentId)
      if (!att) return
      att.previewStatus = previewStatus
    },

    setAttachmentPreview: (state, action) => {
      const { messageId, documentId, previewUrl } = action.payload
      const msgs = state.currentThread?.messages || []
      const msg = msgs.find(m => m.messageId === messageId)
      if (!msg) return
      const att = (msg.attachments || []).find(a => a.documentId === documentId)
      if (!att) return

      // revoke old preview URL if exists to avoid memory leaks
      if (att.previewUrl) URL.revokeObjectURL(att.previewUrl)

      att.previewUrl = previewUrl
      att.previewStatus = 'ready'
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
      state.newlyCreatedThreadId = action.payload?.isNewThread ? action.payload.threadId : null
      if (action.payload?.deepThinking) {
        state.isDeepThinking = true
        state.deepThinkingJobId = action.payload.jobExecutionId
        state.deepThinkingSteps = []
        state.isSendingMessage = false
        try {
          localStorage.setItem('activeDeepThinkingJobId', String(action.payload.jobExecutionId))
          localStorage.setItem('activeDeepThinkingThreadId', action.payload.threadId)
        } catch (_) {}
      } else {
        state.isSendingMessage = false
      }
    })
    builder.addCase(sendMessage.rejected, state => {
      state.isSendingMessage = false
    })
    builder.addCase(pollDeepThinkingStatus.fulfilled, (state, action) => {
      const { status, steps } = action.payload
      state.deepThinkingSteps = steps
      if (['COMPLETED', 'FAILED', 'STOPPED', 'ABANDONED'].includes(status)) {
        state.isDeepThinking = false
        state.deepThinkingJobId = null
        try {
          localStorage.removeItem('activeDeepThinkingJobId')
          localStorage.removeItem('activeDeepThinkingThreadId')
        } catch (_) {}
      }
    })
    builder.addCase(cancelDeepThinking.fulfilled, state => {
      state.isDeepThinking = false
      state.deepThinkingJobId = null
      state.deepThinkingSteps = []
      try {
        localStorage.removeItem('activeDeepThinkingJobId')
        localStorage.removeItem('activeDeepThinkingThreadId')
      } catch (_) {}
    })
    builder.addCase(resumeDeepThinkingIfActive.fulfilled, (state, action) => {
      if (action.payload) {
        state.isDeepThinking = true
        state.deepThinkingJobId = action.payload.jobExecutionId
        state.deepThinkingSteps = []
      }
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

  const messageIds = chatMessages.map(m => m.messageId).filter(Boolean)
  let attachmentsByMessageId = {}
  if (messageIds.length > 0) {
    try {
      const attRes = await chatThreadService.getMessageAttachmentsBatch(organizationId, threadId, messageIds, token)
      attachmentsByMessageId = attRes?.data?.attachmentsByMessageId || {}
    } catch (e) {
      console.error('Failed to fetch message attachments batch:', e)
      attachmentsByMessageId = {}
    }
  }

  // 1) attach attachments
  chatMessages = chatMessages.map(m => {
    const att = attachmentsByMessageId?.[m.messageId] || []
    return {
      ...m,
      attachments: att.map(a => ({
        ...a,
        previewUrl: a.previewUrl || null,
        previewStatus: 'idle'
      }))
    }
  })

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

async function _handleThreadPostSend({ threadId, responseThreadId, projectId, organizationId, token, dispatch }) {
  const isNewThread = !threadId
  const finalThreadId = isNewThread ? responseThreadId : threadId

  if (isNewThread && responseThreadId) {
    _updateThreadsToLocalStorage(responseThreadId)
  }

  // reload threads to get the updated one
  // TODO requires performance improvement
  dispatch(fetchThreads({ organizationId, token }))

  if (isNewThread && finalThreadId) {
    await dispatch(loadThread({ threadId: finalThreadId, projectId, organizationId, token }))
  }

  return { isNewThread, finalThreadId }
}

function _dispatchIncomingMessagesAndToolCalls({ apiMessages = [], responseThreadId, dispatch, iFrameMessageManager, sessionContext }) {
  if (!Array.isArray(apiMessages) || apiMessages.length === 0) return

  // sending PostMessage notification
  iFrameMessageManager?.messageManager?.sendMessage({
    type: 'gendox.events.chat.message.new.response.received',
    payload: apiMessages
  })

  const toolCallsToProcess = []

  apiMessages.forEach(message => {
    dispatch(addMessage(message))

    // If this message invoked any tool calls, stash them for later
    if (Array.isArray(message?.toolCalls) && message?.toolCalls.length) {
      message.toolCalls.forEach(call => {
        toolCallsToProcess.push({
          threadId: responseThreadId,
          messageId: message.id,
          ...call
        })
      })
    }
  })

  if (toolCallsToProcess.length > 0) {
    // Persist the (possibly newly created) thread ID synchronously BEFORE dispatching the
    // tool calls. A tool such as open_web_page navigates the host page, which would otherwise
    // race ahead of the async URL update and lose the new thread ID for session resume.
    if (sessionContext?.isEmbedded && responseThreadId) {
      updateSessionThreadId(
        sessionContext.originUrl,
        sessionContext.organizationId,
        sessionContext.projectId,
        responseThreadId
      )
    }

    // Process tool calls after the message has been added
    // Currently, this is 1-way communication, so we send the tool calls to the parent frame
    // TODO this should be a 2-way communication, where the parent frame processes the tool calls and sends back the results
    iFrameMessageManager?.messageManager?.sendMessage({
      type: 'gendox.events.chat.message.tool_calls.request',
      payload: toolCallsToProcess
    })
  }
}

