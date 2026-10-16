import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useIFrameMessageManager } from 'src/authentication/context/IFrameMessageManagerContext'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import { loadSession, saveSession } from 'src/utils/embeddedChatSession'
import Chat from 'src/components/chat/Chat'
import useChat from 'src/components/chat/useChat'

const AUTH_PROVIDER_OPTION = 'IFrameAuthProvider'
const CHAT_TOGGLE_REQUEST_EVENT = 'gendox.events.embedded.chat.toggle.request'

/**
 * The chat inside the website widget: a bubble that opens the chat window.
 * The host page's script (gendox-widget-plugin.js) sizes the iframe; this page fills it.
 * Also works for visitors who are not signed in.
 */
const EmbeddedChatPage = () => {
  const router = useRouter()
  const { organizationId, projectId } = router.query
  const [isOpen, setIsOpen] = useState(false)
  const iFrameMessageManager = useIFrameMessageManager()
  const { isEmbedded, iFrameConfiguration, originUrl } = iFrameMessageManager
  const isOpenRef = useRef(false)
  const sessionRestoredRef = useRef(false)

  const { token, newThread, openThread } = useChat({ authProviderOption: AUTH_PROVIDER_OPTION })

  const sendToggleMessage = nextState => {
    iFrameMessageManager.messageManager.sendMessage({
      type: 'gendox.events.embedded.chat.toggle.action',
      data: { isOpen: nextState }
    })
  }

  const applyChatState = (nextState, withAnimation = true) => {
    if (isOpenRef.current === nextState) return

    if (nextState) {
      sendToggleMessage(true)
      if (withAnimation) {
        setTimeout(() => setIsOpen(true), 10)
      } else {
        setIsOpen(true)
      }

      return
    }

    setIsOpen(false)
    if (withAnimation) {
      setTimeout(() => sendToggleMessage(false), 320)
    } else {
      sendToggleMessage(false)
    }
  }

  // The frame is see-through around the bubble, and light unless the host asks otherwise with ?theme=
  useEffect(() => {
    const root = document.documentElement
    const previous = { theme: root.dataset.theme, html: root.style.background, body: document.body.style.background }
    if (!new URLSearchParams(window.location.search).get('theme')) root.dataset.theme = 'light'
    root.style.background = 'transparent'
    document.body.style.background = 'transparent'

    return () => {
      root.dataset.theme = previous.theme
      root.style.background = previous.html
      document.body.style.background = previous.body
    }
  }, [])

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  // Restore session: runs once after the init response provides sessionResumeTimeoutMs.
  // Gated by isEmbedded so it never fires when the chat page is opened directly.
  useEffect(() => {
    const timeoutMs = iFrameConfiguration?.sessionResumeTimeoutMs
    if (!isEmbedded || !timeoutMs || !originUrl || !organizationId || !projectId) return
    if (sessionRestoredRef.current) return
    sessionRestoredRef.current = true

    const session = loadSession(originUrl, organizationId, projectId, timeoutMs)
    if (!session || !session.isOpen) return

    applyChatState(true, false)

    if (session.threadId) {
      router.replace({ pathname: router.pathname, query: { ...router.query, threadId: session.threadId } }, undefined, {
        shallow: true
      })
    }
  }, [isEmbedded, iFrameConfiguration?.sessionResumeTimeoutMs, originUrl, organizationId, projectId])

  // Save session whenever the open state or active thread changes.
  // Gated by isEmbedded so host-page-less usage is unaffected.
  useEffect(() => {
    const timeoutMs = iFrameConfiguration?.sessionResumeTimeoutMs
    if (!isEmbedded || !timeoutMs || !originUrl || !organizationId || !projectId) return
    saveSession(originUrl, organizationId, projectId, { threadId: router.query.threadId ?? null, isOpen }, timeoutMs)
  }, [
    isOpen,
    router.query.threadId,
    isEmbedded,
    iFrameConfiguration?.sessionResumeTimeoutMs,
    originUrl,
    organizationId,
    projectId
  ])

  // Apply chat open/closed state from config (initial load and when parent calls updateConfig)
  useEffect(() => {
    const chatInitialState = iFrameMessageManager?.iFrameConfiguration?.chatInitialState
    if (chatInitialState === undefined) return
    applyChatState(chatInitialState === 'open', false)
  }, [iFrameMessageManager?.iFrameConfiguration?.chatInitialState])

  useEffect(() => {
    const handleToggleRequest = data => {
      if (data?.type !== CHAT_TOGGLE_REQUEST_EVENT) return

      const action = data?.data?.action
      if (!action) return

      if (action === 'toggle') {
        applyChatState(!isOpenRef.current)

        return
      }

      if (action === 'open') {
        applyChatState(true)

        return
      }

      if (action === 'close') {
        applyChatState(false)
      }
    }

    iFrameMessageManager.messageManager.addHandler(handleToggleRequest)

    return () => {
      iFrameMessageManager.messageManager.removeHandler(handleToggleRequest)
    }
  }, [iFrameMessageManager])

  const toggleChatWindow = () => {
    applyChatState(!isOpenRef.current)
  }

  return (
    <>
      {!isOpen && (
        <button className='wgt-bubble' aria-label='Open chat' onClick={toggleChatWindow}>
          <span className='mark white' style={{ width: '46%', height: '46%' }} />
        </button>
      )}
      <div className={`wgt-panel ${isOpen ? 'open' : ''}`}>
        <Chat
          token={token}
          variant='widget'
          header
          threadsDrawer
          sources={false}
          poweredBy
          onNewThread={newThread}
          onOpenThread={openThread}
          onClose={toggleChatWindow}
        />
      </div>
    </>
  )
}

EmbeddedChatPage.pageConfig = {
  authProviderOption: AUTH_PROVIDER_OPTION,
  routeType: routeTypes.sharedRoute
}

export default EmbeddedChatPage
