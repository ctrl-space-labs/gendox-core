import { useEffect } from 'react'
import { useRouter } from 'next/router'
import GendoxPageLoader from 'src/authentication/components/GendoxPageLoader'

// Chats open as tabs in the agent home. Keeps old links and bookmarks to a chat working.
const ChatRedirect = () => {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return
    const { organizationId, projectId, threadId } = router.query
    const query = new URLSearchParams(Object.entries({ organizationId, projectId }).filter(([, v]) => v)).toString()
    router.replace(`/gendox/agent-home/${query ? '?' + query : ''}#/chat/${threadId || 'new'}`)
  }, [router])

  return <GendoxPageLoader />
}

export default ChatRedirect
