import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { shallowEqual, useDispatch, useSelector } from 'react-redux'
import { useAuth } from 'src/authentication/useAuth'
import {
  MAIN_CHAT,
  chatActions,
  fetchThreads,
  hydrateAttachmentPreviews,
  loadThread,
  selectChatSession
} from 'src/store/chat/gendoxChat'
import { localStorageConstants } from 'src/utils/generalConstants'
import { isValidOrganization } from 'src/utils/validators'

// the organization whose threads and agents the store holds; a different one starts the store again
let threadsOrganizationId = null

/**
 * The user's threads in the organization (with their agents), loaded once per organization for every chat on screen
 * and the agent home's recent chats.
 */
export const useChatThreads = (organizationId, { authProviderOption } = {}) => {
  const { user } = useAuth()
  const dispatch = useDispatch()
  const threads = useSelector(state => state.gendoxChat.threads)

  useEffect(() => {
    if (!isValidOrganization(organizationId, user) && authProviderOption !== 'IFrameAuthProvider') return
    if (threadsOrganizationId === organizationId) return
    threadsOrganizationId = organizationId
    dispatch(chatActions.resetChatState())
    dispatch(fetchThreads({ organizationId, token: window.localStorage.getItem(localStorageConstants.accessTokenKey) }))
  }, [dispatch, organizationId, user, authProviderOption])

  return threads
}

/**
 * Keeps one chat in the store (see Chat's chatKey) showing a thread: loads the user's threads once per organization,
 * the thread and its attachment previews, and reports a thread created by the first message.
 *
 * @param threadId - null for a new conversation
 * @param onThreadCreated - (threadId) once the first message has created the thread
 */
export const useChatSession = ({ chatKey = MAIN_CHAT, organizationId, projectId, threadId, authProviderOption, onThreadCreated }) => {
  const dispatch = useDispatch()
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(localStorageConstants.accessTokenKey) : null
  const { agents, threads } = useSelector(state => ({ agents: state.gendoxChat.agents, threads: state.gendoxChat.threads }), shallowEqual)
  const { currentThread, newlyCreatedThreadId, isLoadingMessages } = useSelector(
    state => selectChatSession(state, chatKey),
    shallowEqual
  )
  const created = useRef(onThreadCreated)
  created.current = onThreadCreated
  const shown = useRef(null)
  shown.current = isLoadingMessages ? null : currentThread

  useChatThreads(organizationId, { authProviderOption })

  useEffect(() => {
    // a chat that moved to another window is mounted again; it already shows its thread
    const loaded = shown.current
    if (loaded && (loaded.threadId ?? null) === (threadId || null) && loaded.projectId === projectId) return
    dispatch(chatActions.clearCurrentMessageMetadata(chatKey))
    dispatch(loadThread({ projectId, threadId: threadId || null, organizationId, token, chatKey }))
  }, [dispatch, projectId, threadId, organizationId, token, chatKey])

  useEffect(() => {
    if (!currentThread?.threadId) return
    dispatch(hydrateAttachmentPreviews({ threadId: currentThread.threadId, token, messages: currentThread.messages, chatKey }))
  }, [currentThread?.threadId, chatKey])

  useEffect(() => {
    if (!currentThread) return
    if (agents && currentThread.projectId !== currentThread.agent?.projectId) {
      dispatch(chatActions.updateCurrentThreadWithAgent(chatKey))
    }
    if (threads && currentThread.threadId !== currentThread.thread?.id) {
      dispatch(chatActions.updateCurrentThreadWithThreadObj(chatKey))
    }
  }, [currentThread, agents, threads, dispatch, chatKey])

  useEffect(() => {
    if (!newlyCreatedThreadId) return
    dispatch(chatActions.clearNewlyCreatedThreadId(chatKey))
    if (newlyCreatedThreadId !== threadId) created.current?.(newlyCreatedThreadId)
  }, [dispatch, newlyCreatedThreadId, threadId, chatKey])

  return { token }
}

/**
 * The page's chat, kept in step with the URL (?organizationId, ?projectId, ?threadId):
 * a newly created thread's id goes into the URL, and New / open thread change it.
 *
 * Used once per page that shows a chat.
 */
const useChat = ({ authProviderOption } = {}) => {
  const router = useRouter()
  const { organizationId, threadId, projectId } = router.query

  const { token } = useChatSession({
    organizationId,
    projectId,
    threadId: (Array.isArray(threadId) ? threadId[0] : threadId) || null,
    authProviderOption,
    onThreadCreated: id => {
      if (!router.isReady) return
      router.replace({ pathname: router.pathname, query: { ...router.query, threadId: id } }, undefined, { shallow: true })
    }
  })

  const newThread = useCallback(() => {
    const nextQuery = { ...router.query }
    delete nextQuery.threadId
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true })
  }, [router])

  const openThread = useCallback(
    thread => {
      const query = { ...router.query, threadId: thread.threadId }
      if (thread.agent?.projectId) query.projectId = thread.agent.projectId
      router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
    },
    [router]
  )

  return { token, newThread, openThread }
}

export default useChat
