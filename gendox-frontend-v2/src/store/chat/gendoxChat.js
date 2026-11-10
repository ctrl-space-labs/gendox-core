import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import projectService from 'src/gendox-sdk/projectService'
import taskService from 'src/gendox-sdk/taskService'
import { generalConstants } from 'src/utils/generalConstants'
import chatConverter from '../../converters/chat.converter'
import chatThreadService from '../../gendox-sdk/chatThreadService'
import completionService from '../../gendox-sdk/completionService'
import { readCompletionSession, saveCompletionSession } from 'src/utils/chatCompletionSession'
import documentService from '../../gendox-sdk/documentService'
import { updateSessionThreadId } from 'src/utils/embeddedChatSession'
import { getErrorMessage } from 'src/utils/errorHandler'
import toast from 'react-hot-toast'

// a turn still running on the server: the chat follows it until it ends
export const ACTIVE_COMPLETION_STATUSES = ['GENERATING', 'WAITING_FOR_TOOLS']

const DEFAULT_LOCAL_CONTEXT_MAX_RESPONSES = 0 // basically dont wait
const DEFAULT_LOCAL_CONTEXT_MAX_WAIT_MS = 10

const resolveLocalContextFetchConfig = iFrameMessageManager => {
  const config = iFrameMessageManager?.iFrameConfiguration || {}
  return {
    maxResponses: config.localContextMaxResponses ?? DEFAULT_LOCAL_CONTEXT_MAX_RESPONSES,
    maxWaitTimeoutMs: config.localContextMaxWaitMs ?? DEFAULT_LOCAL_CONTEXT_MAX_WAIT_MS
  }
}

// What one chat on screen shows. Several chats can be open at once (the agent home's windows), each under its own key;
// the chat page, the widget and side panels use MAIN_CHAT.
export const MAIN_CHAT = 'main'

const emptySession = () => ({
  currentThread: null,
  isSendingMessage: false,
  completionStatus: null,
  isStreaming: false,
  streamRequestId: null,
  currentMessageMetadata: null,
  isLoadingMessages: null,
  isLoadingMetadata: null,
  isDeepThinking: false,
  deepThinkingJobId: null,
  deepThinkingSteps: [],
  newlyCreatedThreadId: null
})

const EMPTY_SESSION = Object.freeze(emptySession())

// the threads and agents are shared by every chat
const initialChatState = {
  threads: null,
  agents: null,
  isLoadingAgentsAndThreads: null,
  // the organization the threads are loading for, and the latest request's id: only its answer is kept
  loadingThreadsFor: null,
  latestThreadsRequest: null,
  // the organization the agents belong to, and the latest request for them: only its answer is kept
  agentsFor: null,
  latestAgentsRequest: null,
  sessions: {}
}

/** One chat's state, e.g. useSelector(state => selectChatSession(state, chatKey)) */
export const selectChatSession = (state, chatKey = MAIN_CHAT) => state.gendoxChat.sessions[chatKey] ?? EMPTY_SESSION

const keyOf = action => action.meta?.arg?.chatKey ?? action.payload?.chatKey ?? MAIN_CHAT

const sessionOf = (state, chatKey) => {
  if (!state.sessions[chatKey]) state.sessions[chatKey] = emptySession()

  return state.sessions[chatKey]
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
      // 1. Get the organization's agents from the Redux state, or load them. The ones just loaded are used as
      // returned: the store may meanwhile hold another organization's, from an answer that arrived late.
      const chat = getState().gendoxChat
      let agents = chat.agentsFor === organizationId ? chat.agents : null
      if (!agents || agents.length === 0) {
        agents = await dispatch(fetchAgents({ organizationId, token })).unwrap()
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
  },
  // The sidebar and the Conversations page both ask as a page opens: the threads already on their way for the same
  // organization answer both. A refresh after a change (force) always goes, since a list already on its way may
  // predate the change.
  {
    condition: ({ organizationId, force }, { getState }) =>
      force || getState().gendoxChat.loadingThreadsFor !== organizationId
  }
)

export const loadThread = createAsyncThunk(
  'gendoxChat/loadThread',
  async ({ threadId, projectId, organizationId, token, chatKey = MAIN_CHAT }, { dispatch, getState, rejectWithValue }) => {
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

/** 👍 (1), 👎 (-1) or none (null) on an answer, shown at once and put back if saving fails */
export const setMessageFeedback = createAsyncThunk(
  'gendoxChat/setMessageFeedback',
  async ({ messageId, feedback, feedbackComment = null, token }, { rejectWithValue }) => {
    try {
      const response = await chatThreadService.updateMessage(messageId, { feedback, feedbackComment }, token)
      return response.data
    } catch (error) {
      toast.error(`Couldn’t save your feedback. ${getErrorMessage(error)}`)
      return rejectWithValue(error.message)
    }
  }
)

export const sendMessage = createAsyncThunk(
  'gendoxChat/sendMessage',
  async (
    { user, currentThread, message, uploadedDocs = [], organizationId, iFrameMessageManager, token, chatKey = MAIN_CHAT },
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
        chatKey,
        message: {
          createdBy: user.id,
          value: message,
          createdAt: new Date().toISOString(),
          attachments: uploadedDocs
        }
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
    let response
    try {
      response = deepThinking
        ? await completionService.postCompletionMessage(projectId, threadId, message, chatLocalContextResponses, documentInstanceIds, token, true)
        : await _streamCompletion({ projectId, organizationId, token, dispatch, chatKey, iFrameMessageManager,
            // Only an embedded chat has a host page to answer CLIENT tools; elsewhere they run as ACTION
            payload: { threadId, value: message, localContexts: chatLocalContextResponses, documentInstanceIds,
              stream: true, clientToolResults: Boolean(iFrameMessageManager?.isEmbedded) } })
    } catch (error) {
      // the chat shows the failure under the question, with Try again
      return rejectWithValue({ errorCode: error.response?.data?.errorCode, errorMessage: getErrorMessage(error) })
    }

    // Deep thinking returns HTTP 202 with { jobExecutionId, threadId }
    if (response.status === 202 && response.data?.jobExecutionId) {
      const { jobExecutionId, threadId: responseThreadId } = response.data

      const { finalThreadId } = await _handleThreadPostSend({
        threadId,
        responseThreadId,
        projectId,
        organizationId,
        token,
        dispatch,
        chatKey
      })

      return { deepThinking: true, jobExecutionId, threadId: finalThreadId, isNewThread: !threadId }
    }

    const { threadId: responseThreadId } = response.data

    // the stream already put the thread's messages in the store
    const { finalThreadId } = await _handleThreadPostSend({
      threadId,
      responseThreadId,
      projectId,
      organizationId,
      token,
      dispatch,
      chatKey,
      skipLoad: true
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
  async ({ threadId, token, iFrameMessageManager, chatKey = MAIN_CHAT }, { getState, dispatch, rejectWithValue }) => {
    try {
      if (!threadId) return { addedCount: 0 }

      const response = await chatThreadService.getThreadMessagesByCriteria(threadId, token)
      const apiMessages = response?.data?.content || []
      const existingMessages = selectChatSession(getState(), chatKey).currentThread?.messages || []
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

      const currentThread = selectChatSession(getState(), chatKey).currentThread
      _dispatchIncomingMessagesAndToolCalls({
        apiMessages: newApiMessages,
        responseThreadId: threadId,
        dispatch,
        chatKey,
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

export const addMessage = createAsyncThunk('gendoxChat/pushMessage', async ({ message }) => {
  return chatConverter.gendoxMessageToThreadMessage(message)
})

export const hydrateAttachmentPreviews = createAsyncThunk(
  'gendoxChat/hydrateAttachmentPreviews',
  async ({ threadId, token, messages, chatKey = MAIN_CHAT }, { dispatch }) => {
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
            chatKey,
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
              chatKey,
              messageId: item.messageId,
              documentId: item.documentId,
              previewUrl: blobUrl
            })
          )
        } catch (e) {
          dispatch(
            chatActions.setAttachmentPreviewStatus({
              chatKey,
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


const revokeThreadPreviewUrls = thread => {
  ;(thread?.messages || []).forEach(m => {
    ;(m?.attachments || []).forEach(a => {
      if (a?.previewUrl) URL.revokeObjectURL(a.previewUrl)
    })
  })
}

const forgetDeepThinkingJob = () => {
  try {
    localStorage.removeItem('activeDeepThinkingJobId')
    localStorage.removeItem('activeDeepThinkingThreadId')
  } catch (_) {}
}

const gendoxChatSlice = createSlice({
  name: 'gendoxChat',
  initialState: initialChatState,
  reducers: {
    // one event of a streamed completion; payload: { chatKey, projectId, event, data }
    completionEvent: (state, { payload }) => {
      const { chatKey = MAIN_CHAT, event, data, projectId } = payload
      const session = state.sessions[chatKey]
      const thread = session?.currentThread
      if (!thread || thread.projectId !== projectId) return
      if (data.threadId && thread.threadId && data.threadId !== thread.threadId) return
      if (event === 'connect') {
        session.streamRequestId = data.requestId
        session.isStreaming = true
      }
      if (data.requestId && data.requestId !== session.streamRequestId) return
      if (event === 'start') {
        thread.threadId = data.threadId
        thread.id = data.threadId
        session.completionStatus = 'GENERATING'
        session.isStreaming = true
        session.isSendingMessage = true
      }
      if (event === 'delta') {
        const key = `stream:${data.turnId}:${data.messageIndex}`
        let message = thread.messages.find(m => m.streamKey === key)
        if (!message) {
          thread.messages.push({
            streamKey: key,
            role: 'assistant',
            createdBy: thread.agent?.userId || thread.agent?.id,
            createdAt: new Date().toISOString(),
            message: '',
            reasoningContent: '',
            isStreaming: true
          })
          message = thread.messages[thread.messages.length - 1]
        }
        message[data.field === 'reasoningContent' ? 'reasoningContent' : 'message'] += data.text
      }
      if (event === 'message') {
        const message = data.message
        if (message.name === 'completion_limit_warning') return
        const converted = chatConverter.gendoxMessageToThreadMessage(message)
        const key = `stream:${data.turnId}:${data.messageIndex}`
        const index = thread.messages.findIndex(m => m.messageId === message.id || m.streamKey === key)
        if (index >= 0) thread.messages[index] = converted
        else thread.messages.push(converted)
      }
      if (event === 'waiting_for_tools' || event === 'status') {
        session.completionStatus = data.status
        session.isSendingMessage = ACTIVE_COMPLETION_STATUSES.includes(data.status)
        session.isStreaming = false
      }
      if (event === 'done' || event === 'error' || event === 'detached') {
        session.isStreaming = false
        if (event !== 'detached') {
          session.completionStatus = event === 'done' ? 'COMPLETED' : 'FAILED'
          session.isSendingMessage = false
        }
        if (event === 'done') thread.messages = thread.messages.filter(m => !m.isStreaming)
      }
      if (event === 'reconcile') {
        session.currentThread = { ...thread, messages: data.messages }
      }
    },
    resetChatState: state => {
      Object.values(state.sessions).forEach(session => revokeThreadPreviewUrls(session.currentThread))
      Object.assign(state, { ...initialChatState, sessions: {} })
    },
    // a chat that left the screen (a closed window) drops its state; payload: chatKey
    removeChatSession: (state, action) => {
      const session = state.sessions[action.payload]
      if (!session) return
      revokeThreadPreviewUrls(session.currentThread)
      delete state.sessions[action.payload]
    },
    clearDeepThinkingState: (state, action) => {
      const session = sessionOf(state, action.payload ?? MAIN_CHAT)
      session.isDeepThinking = false
      session.deepThinkingJobId = null
      session.deepThinkingSteps = []
      forgetDeepThinkingJob()
    },
    // payload: chatKey
    updateCurrentThreadWithAgent: (state, action) => {
      const session = state.sessions[action.payload ?? MAIN_CHAT]
      if (!session?.currentThread) return
      const foundAgent = state.agents?.find(agent => agent.projectId === session.currentThread.projectId)
      if (foundAgent) session.currentThread.agent = foundAgent
    },
    // payload: chatKey
    updateCurrentThreadWithThreadObj: (state, action) => {
      const session = state.sessions[action.payload ?? MAIN_CHAT]
      if (!session?.currentThread) return
      const foundThread = state.threads?.find(thread => thread.id === session.currentThread.threadId)
      if (foundThread) session.currentThread.thread = foundThread
    },
    // payload: chatKey
    clearCurrentMessageMetadata: (state, action) => {
      sessionOf(state, action.payload ?? MAIN_CHAT).currentMessageMetadata = ''
    },
    // payload: chatKey
    clearNewlyCreatedThreadId: (state, action) => {
      sessionOf(state, action.payload ?? MAIN_CHAT).newlyCreatedThreadId = null
    },
    setAttachmentPreviewStatus: (state, action) => {
      const { chatKey = MAIN_CHAT, messageId, documentId, previewStatus } = action.payload
      const msg = (state.sessions[chatKey]?.currentThread?.messages || []).find(m => m.messageId === messageId)
      const att = (msg?.attachments || []).find(a => a.documentId === documentId)
      if (att) att.previewStatus = previewStatus
    },
    setAttachmentPreview: (state, action) => {
      const { chatKey = MAIN_CHAT, messageId, documentId, previewUrl } = action.payload
      const msg = (state.sessions[chatKey]?.currentThread?.messages || []).find(m => m.messageId === messageId)
      const att = (msg?.attachments || []).find(a => a.documentId === documentId)
      if (!att) return
      // revoke old preview URL if exists to avoid memory leaks
      if (att.previewUrl) URL.revokeObjectURL(att.previewUrl)
      att.previewUrl = previewUrl
      att.previewStatus = 'ready'
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchAgents.pending, (state, action) => {
      state.latestAgentsRequest = action.meta.requestId
    })
    builder.addCase(fetchAgents.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.latestAgentsRequest) return
      state.agents = action.payload
      state.agentsFor = action.meta.arg.organizationId
    })
    builder.addCase(fetchThreads.fulfilled, (state, action) => {
      if (action.meta.requestId !== state.latestThreadsRequest) return
      state.threads = action.payload
      state.isLoadingAgentsAndThreads = false
      state.loadingThreadsFor = null
    })
    builder.addCase(fetchThreads.pending, (state, action) => {
      state.isLoadingAgentsAndThreads = true
      state.loadingThreadsFor = action.meta.arg.organizationId
      state.latestThreadsRequest = action.meta.requestId
    })
    builder.addCase(fetchThreads.rejected, (state, action) => {
      if (action.meta.requestId !== state.latestThreadsRequest) return
      state.isLoadingAgentsAndThreads = false
      state.loadingThreadsFor = null
    })
    builder.addCase(loadThread.pending, (state, action) => {
      const session = sessionOf(state, keyOf(action))
      session.currentThread = null
      session.streamRequestId = null
      session.isStreaming = false
      session.completionStatus = null
      session.isSendingMessage = false
      session.isLoadingMessages = true
    })
    builder.addCase(loadThread.fulfilled, (state, action) => {
      const session = sessionOf(state, keyOf(action))
      session.currentThread = action.payload
      session.isLoadingMessages = false
    })
    builder.addCase(loadThread.rejected, (state, action) => {
      const session = sessionOf(state, keyOf(action))
      session.currentThread = null
      session.isLoadingMessages = false
    })
    builder.addCase(fetchMessageMetadata.pending, (state, action) => {
      const { thread, message } = action.meta.arg
      const session = sessionOf(state, keyOf(action))
      session.currentMessageMetadata = { isFetching: true, metadata: null, thread, message }
      session.isLoadingMetadata = true
    })
    builder.addCase(fetchMessageMetadata.fulfilled, (state, action) => {
      const { thread, message } = action.meta.arg
      const session = sessionOf(state, keyOf(action))
      session.currentMessageMetadata = { isFetching: false, metadata: action.payload, thread, message }
      session.isLoadingMetadata = false
    })
    builder.addCase(fetchMessageMetadata.rejected, (state, action) => {
      const session = sessionOf(state, keyOf(action))
      session.currentMessageMetadata = null
      session.isLoadingMetadata = false
    })
    builder.addCase(setMessageFeedback.pending, (state, action) => {
      const { messageId, feedback, feedbackComment = null } = action.meta.arg
      const message = sessionOf(state, keyOf(action)).currentThread?.messages?.find(m => m.messageId === messageId)
      if (message) Object.assign(message, { feedback, feedbackComment: feedback == null ? null : feedbackComment })
    })
    builder.addCase(setMessageFeedback.rejected, (state, action) => {
      const { messageId, previous } = action.meta.arg
      const message = sessionOf(state, keyOf(action)).currentThread?.messages?.find(m => m.messageId === messageId)
      if (message && previous) Object.assign(message, previous)
    })
    builder.addCase(sendMessage.pending, (state, action) => {
      sessionOf(state, keyOf(action)).isSendingMessage = true
    })
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      const session = sessionOf(state, keyOf(action))
      session.newlyCreatedThreadId = action.payload?.isNewThread ? action.payload.threadId : null
      session.isSendingMessage = ACTIVE_COMPLETION_STATUSES.includes(session.completionStatus)
      if (action.payload?.deepThinking) {
        session.isDeepThinking = true
        session.deepThinkingJobId = action.payload.jobExecutionId
        session.deepThinkingSteps = []
        try {
          localStorage.setItem('activeDeepThinkingJobId', String(action.payload.jobExecutionId))
          localStorage.setItem('activeDeepThinkingThreadId', action.payload.threadId)
        } catch (_) {}
      }
    })
    builder.addCase(sendMessage.rejected, (state, action) => {
      const session = sessionOf(state, keyOf(action))
      session.isSendingMessage = ACTIVE_COMPLETION_STATUSES.includes(session.completionStatus)
      // A turn that still runs is recovered by polling; one that ended marks its question as failed
      const messages = session.currentThread?.messages
      if (session.isSendingMessage || !messages) return
      const userId = action.meta.arg?.user?.id
      const question = [...messages].reverse().find(m => m.createdBy === userId)
      if (question) question.failed = { code: action.payload?.errorCode, message: action.payload?.errorMessage }
    })
    builder.addCase(pollDeepThinkingStatus.fulfilled, (state, action) => {
      const { status, steps } = action.payload
      const session = sessionOf(state, keyOf(action))
      session.deepThinkingSteps = steps
      if (['COMPLETED', 'FAILED', 'STOPPED', 'ABANDONED'].includes(status)) {
        session.isDeepThinking = false
        session.deepThinkingJobId = null
        forgetDeepThinkingJob()
      }
    })
    builder.addCase(cancelDeepThinking.fulfilled, (state, action) => {
      const session = sessionOf(state, keyOf(action))
      session.isDeepThinking = false
      session.deepThinkingJobId = null
      session.deepThinkingSteps = []
      forgetDeepThinkingJob()
    })
    builder.addCase(addMessage.fulfilled, (state, action) => {
      const session = state.sessions[keyOf(action)]
      if (session?.currentThread?.messages) {
        session.currentThread.messages = [...session.currentThread.messages, action.payload]
      }
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

  let chatMessages = messagesResponse.data.content
    .filter(message => message.name !== 'completion_limit_warning')
    .map(message => chatConverter.gendoxMessageToThreadMessage(message))

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

async function _handleThreadPostSend({ threadId, responseThreadId, projectId, organizationId, token, dispatch, chatKey, skipLoad = false }) {
  const isNewThread = !threadId
  const finalThreadId = isNewThread ? responseThreadId : threadId

  if (isNewThread && responseThreadId) {
    _updateThreadsToLocalStorage(responseThreadId)
  }

  // reload threads to get the updated one
  // TODO requires performance improvement
  dispatch(fetchThreads({ organizationId, token, force: true }))

  if (isNewThread && finalThreadId && !skipLoad) {
    await dispatch(loadThread({ threadId: finalThreadId, projectId, organizationId, token, chatKey }))
  }

  return { isNewThread, finalThreadId }
}

function _dispatchIncomingMessagesAndToolCalls({ apiMessages = [], responseThreadId, dispatch, chatKey, iFrameMessageManager, sessionContext }) {
  if (!Array.isArray(apiMessages) || apiMessages.length === 0) return

  // sending PostMessage notification
  iFrameMessageManager?.messageManager?.sendMessage({
    type: 'gendox.events.chat.message.new.response.received',
    payload: apiMessages
  })

  const toolCallsToProcess = []

  apiMessages.forEach(message => {
    dispatch(addMessage({ chatKey, message }))

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

const DELTA_FLUSH_MS = 50

const completionEvent = (dispatch, chatKey, projectId, event, data) =>
  dispatch(chatActions.completionEvent({ chatKey, projectId, event, data }))

// Sends the tool calls the host page runs (client tools) to it, each once per turn
function dispatchHostCalls(data, context) {
  const { projectId, organizationId, iFrameMessageManager } = context
  if (iFrameMessageManager?.isEmbedded)
    updateSessionThreadId(iFrameMessageManager.originUrl, organizationId, projectId, data.threadId)
  const calls =
    data.toolCalls ||
    (data.pendingCalls || []).map(call => ({
      id: call.id,
      type: 'function',
      messageId: call.messageId,
      function: { name: call.name, arguments: call.arguments },
      execution: 'CLIENT'
    }))
  const session = readCompletionSession(data.threadId)
  const sent = new Set(session.dispatchedCalls || [])
  const pending = calls.filter(call => !sent.has(call.id))
  if (!pending.length) return
  pending.forEach(call => sent.add(call.id))
  saveCompletionSession(data.threadId, { dispatchedCalls: [...sent] })
  iFrameMessageManager?.messageManager?.sendMessage({
    type: 'gendox.events.chat.message.tool_calls.request',
    payload: pending.map(call => ({
      threadId: data.threadId,
      turnId: data.turnId,
      messageId: data.messageId,
      execution: data.execution || 'CLIENT',
      ...call
    }))
  })
}

async function _streamCompletion(context) {
  const { projectId, organizationId, dispatch, chatKey, token, payload, iFrameMessageManager } = context
  const requestId = globalThis.crypto.randomUUID()
  let threadId = payload.threadId
  completionEvent(dispatch, chatKey, projectId, 'connect', { threadId, requestId })
  let turnId = readCompletionSession(threadId).turnId

  // A fast model sends many tokens per network chunk. Rendering each one at once starves React's
  // other updates (minified React error #185), so tokens are drawn in batches.
  let deltas = []
  let flushTimer = null
  const flushDeltas = () => {
    clearTimeout(flushTimer)
    flushTimer = null
    const batch = deltas
    deltas = []
    batch.forEach(delta => completionEvent(dispatch, chatKey, projectId, 'delta', delta))
  }

  try {
    const response = await completionService.postChatMessage(
      projectId,
      payload,
      token,
      readCompletionSession(threadId).resumeToken,
      async (event, data) => {
        if (event === 'delta') {
          deltas.push({ ...data, threadId, requestId })
          if (!flushTimer) flushTimer = setTimeout(flushDeltas, DELTA_FLUSH_MS)

          return
        }
        flushDeltas()
        if (event === 'start') {
          threadId = data.threadId
          turnId = data.turnId
          const previousSession = readCompletionSession(threadId)
          saveCompletionSession(threadId, { turnId, ...(previousSession.turnId !== turnId ? { dispatchedCalls: [] } : {}) })
          if (iFrameMessageManager?.isEmbedded)
            updateSessionThreadId(iFrameMessageManager.originUrl, organizationId, projectId, threadId)
        }
        // A turn gets a resume token when it first waits for tools; an anonymous session sends it with the results
        if (event === 'waiting_for_tools' && data.resumeToken) {
          saveCompletionSession(threadId, { resumeToken: data.resumeToken })
        }
        if (event === 'message') data = { ...data, turnId, threadId }
        data = { ...data, requestId }
        completionEvent(dispatch, chatKey, projectId, event, data)
        if (event === 'tool_calls' || event === 'waiting_for_tools') dispatchHostCalls(data, context)
        if (event === 'done') {
          for (const message of data.messages || [])
            completionEvent(dispatch, chatKey, projectId, 'message', { threadId, turnId, message, requestId })
          iFrameMessageManager?.messageManager?.sendMessage({
            type: 'gendox.events.chat.message.new.response.received',
            payload: data.messages || []
          })
        }
      }
    )
    if (response.status === 202) {
      completionEvent(dispatch, chatKey, projectId, 'status', { ...response.data, requestId })
    }

    return response
  } catch (error) {
    flushDeltas()
    completionEvent(dispatch, chatKey, projectId, 'detached', { threadId, requestId })
    throw error
  }
}

let clientResultQueue = Promise.resolve()
const pendingClientResults = new Set()

/** Sends the result of a client tool the host page ran, and streams the rest of the turn */
export const submitClientToolResult = createAsyncThunk(
  'gendoxChat/submitClientToolResult',
  async ({ result, token, organizationId, projectId, iFrameMessageManager, chatKey = MAIN_CHAT }, { dispatch, rejectWithValue }) => {
    const key = `${result.threadId}|${result.turnId || result.messageId || ''}|${result.toolCallId}`
    if (pendingClientResults.has(key)) return
    pendingClientResults.add(key)
    const ack = extra =>
      iFrameMessageManager?.messageManager?.sendMessage({
        type: 'gendox.events.chat.message.tool_calls.ack',
        payload: { threadId: result.threadId, turnId: result.turnId, messageId: result.messageId, toolCallId: result.toolCallId, ...extra }
      })
    try {
      const submission = clientResultQueue.then(() =>
        _streamCompletion({
          projectId,
          organizationId,
          token,
          dispatch,
          chatKey,
          iFrameMessageManager,
          payload: {
            threadId: result.threadId,
            role: 'tool',
            toolCallId: result.toolCallId,
            value: result.value ?? JSON.stringify(result.result ?? null),
            stream: true
          }
        })
      )
      clientResultQueue = submission.catch(() => {})
      await submission
      ack()
    } catch (error) {
      if ([400, 403, 404, 409].includes(error.response?.status)) {
        ack({ error: error.message })
        toast.error(error.message)
      }

      return rejectWithValue(error.message)
    } finally {
      pendingClientResults.delete(key)
    }
  }
)

const canRecoverCompletion = session =>
  !session.isStreaming &&
  !session.isDeepThinking &&
  (!session.isSendingMessage || ACTIVE_COMPLETION_STATUSES.includes(session.completionStatus))

/** Asks whether a turn is still running on the server (after a reload, or while it waits for tools) and shows where it is */
export const recoverCompletion = createAsyncThunk(
  'gendoxChat/recoverCompletion',
  async ({ threadId, projectId, organizationId, token, iFrameMessageManager, chatKey = MAIN_CHAT }, { dispatch, getState }) => {
    const session = () => selectChatSession(getState(), chatKey)
    if (!threadId || !canRecoverCompletion(session())) return
    try {
      const { data } = await completionService.getCompletionStatus(threadId, token, readCompletionSession(threadId).resumeToken)
      if (!canRecoverCompletion(session())) return
      const previous = session().completionStatus
      completionEvent(dispatch, chatKey, projectId, 'status', data)
      if (data.status === 'WAITING_FOR_TOOLS') dispatchHostCalls(data, { projectId, organizationId, iFrameMessageManager })
      // Load the saved messages while a turn runs, and once more when it ends, to show its final answer
      if (ACTIVE_COMPLETION_STATUSES.includes(data.status) || ACTIVE_COMPLETION_STATUSES.includes(previous)) {
        const thread = await _fetchExistingThreadWithMessages(threadId, projectId, organizationId, dispatch, token)
        if (!session().isStreaming) completionEvent(dispatch, chatKey, projectId, 'reconcile', { threadId, messages: thread.messages })
      }
    } catch (_) {
      // a later poll recovers transient transport errors without repeating the user's request
    }
  }
)
