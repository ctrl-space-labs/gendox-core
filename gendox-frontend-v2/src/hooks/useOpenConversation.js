import { useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import { conversationPath } from 'src/utils/clientTools/deepLinks'

// A conversation opened from a notification or a link before sign-in waits here until after it.
export const PENDING_CONVERSATION_KEY = 'gendox.pending.conversation'

/** Opens a conversation, or keeps it for after sign-in. Missing ids come from the current page. */
const useOpenConversation = () => {
  const router = useRouter()
  const { user } = useAuth()

  return useCallback(
    target => {
      const conversation = {
        organizationId: target.organizationId || router.query.organizationId,
        projectId: target.projectId || router.query.projectId,
        threadId: target.threadId
      }
      if (!user) {
        sessionStorage.setItem(PENDING_CONVERSATION_KEY, JSON.stringify(conversation))
        return
      }
      router.push(conversationPath(conversation))
    },
    [router, user]
  )
}

export default useOpenConversation
