import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { useAuth } from 'src/authentication/useAuth'
import { fetchThreads, loadThread, chatActions, hydrateAttachmentPreviews } from 'src/store/chat/gendoxChat'
import { localStorageConstants } from 'src/utils/generalConstants'
import { isValidOrganization } from 'src/utils/validators'

/**
 * Keeps the chat store in step with the URL (?organizationId, ?projectId, ?threadId):
 * loads the user's threads, the open thread and its attachment previews,
 * and puts a newly created thread's id in the URL.
 *
 * Used once per page that shows a chat.
 */
const useChat = ({ authProviderOption } = {}) => {
  const { user } = useAuth()
  const dispatch = useDispatch()
  const router = useRouter()
  const { organizationId, threadId, projectId } = router.query
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(localStorageConstants.accessTokenKey) : null

  const { currentThread, agents, threads, newlyCreatedThreadId } = useSelector(state => state.gendoxChat)

  useEffect(() => {
    if (isValidOrganization(organizationId, user) || authProviderOption === 'IFrameAuthProvider') {
      dispatch(chatActions.resetChatState())
      dispatch(fetchThreads({ organizationId, token }))
    }
  }, [dispatch, organizationId])

  useEffect(() => {
    dispatch(chatActions.clearCurrentMessageMetadata())
    dispatch(loadThread({ projectId, threadId: threadId || null, organizationId, token }))
  }, [dispatch, projectId, threadId, organizationId, token])

  useEffect(() => {
    if (!currentThread?.threadId) return
    dispatch(
      hydrateAttachmentPreviews({
        threadId: currentThread.threadId,
        token,
        messages: currentThread.messages
      })
    )
  }, [currentThread?.threadId])

  useEffect(() => {
    if (!currentThread) return
    if (agents && currentThread?.projectId !== currentThread?.agent?.projectId) {
      dispatch(chatActions.updateCurrentThreadWithAgent())
    }
    if (threads && currentThread?.threadId !== currentThread?.thread?.id) {
      dispatch(chatActions.updateCurrentThreadWithThreadObj())
    }
  }, [currentThread, agents, threads, dispatch, organizationId])

  // a thread created by the first message gets its id in the URL
  useEffect(() => {
    if (!router.isReady || !newlyCreatedThreadId) return

    const queryThreadId = Array.isArray(threadId) ? threadId[0] : threadId
    if (queryThreadId === newlyCreatedThreadId) {
      dispatch(chatActions.clearNewlyCreatedThreadId())

      return
    }

    router
      .replace({ pathname: router.pathname, query: { ...router.query, threadId: newlyCreatedThreadId } }, undefined, {
        shallow: true
      })
      .finally(() => {
        dispatch(chatActions.clearNewlyCreatedThreadId())
      })
  }, [router, dispatch, newlyCreatedThreadId, threadId])

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
