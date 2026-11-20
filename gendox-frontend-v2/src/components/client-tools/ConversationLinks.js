import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import desktopBridge, { isDesktopApp } from 'src/services/desktopBridge'
import { conversationFromLink, conversationPath } from 'src/utils/clientTools/deepLinks'
import useOpenConversation, { PENDING_CONVERSATION_KEY } from 'src/hooks/useOpenConversation'

// Opens conversations from gendox:// links in the desktop app, and, after sign-in, the one a
// link or notification asked for while signed out. Renders nothing.
const ConversationLinks = () => {
  const router = useRouter()
  const { user } = useAuth()
  const openConversation = useOpenConversation()

  useEffect(() => {
    if (!isDesktopApp()) return
    const open = urls =>
      (urls || []).forEach(url => {
        const target = conversationFromLink(url, router.query)
        if (target) openConversation(target)
      })

    // Links that started the app arrive before the page is ready; later ones as events.
    desktopBridge
      .pendingDeepLinks()
      .then(open)
      .catch(error => console.error('Failed to read the links that opened the app', error))

    return desktopBridge.onNativeEvent(event => {
      if (event.type === 'deep-link') open(event.urls)
    })
  }, [openConversation, router.query])

  useEffect(() => {
    if (!user) return
    const saved = sessionStorage.getItem(PENDING_CONVERSATION_KEY)
    if (!saved) return
    sessionStorage.removeItem(PENDING_CONVERSATION_KEY)
    try {
      const target = JSON.parse(saved)
      const checked = conversationFromLink(`gendox://chat/${encodeURIComponent(target.threadId)}`, target)
      if (checked) router.push(conversationPath(checked))
    } catch (error) {
      console.error('Failed to open the saved conversation', error)
    }
  }, [user, router])

  return null
}

export default ConversationLinks
