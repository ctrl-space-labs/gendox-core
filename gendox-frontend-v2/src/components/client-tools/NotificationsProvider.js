import { createContext, useContext, useEffect, useRef } from 'react'
import { useSelector, useStore } from 'react-redux'
import desktopBridge, { isDesktopApp } from 'src/services/desktopBridge'
import {
  browserNotificationAdapter,
  completedThreads,
  createNotificationService
} from 'src/utils/clientTools/notificationRules'
import useOpenConversation from 'src/hooks/useOpenConversation'

// Notifications for answers ready in the background and approvals waiting, in the browser and
// the desktop app. The rules (which events, deduplication, the badge) are in notificationRules;
// this provider connects them to the store and to the browser's or the app's notifications.

const NotificationsContext = createContext(null)

export const useNotifications = () => useContext(NotificationsContext)

const pageFocused = () => !document.hidden && document.hasFocus()

export const NotificationsProvider = ({ children }) => {
  const store = useStore()
  const visibleThreadIds = useSelector(state => state.clientDevice.visibleThreadIds)
  const openConversation = useOpenConversation()
  const openConversationRef = useRef(openConversation)
  openConversationRef.current = openConversation
  const serviceRef = useRef(null)
  // What to do when a desktop notification is clicked, by its numeric id.
  const desktopClicksRef = useRef(new Map())

  if (!serviceRef.current && typeof window !== 'undefined') {
    serviceRef.current = createNotificationService({
      preferences: () => store.getState().clientDevice.preferences,
      visible: threadId => pageFocused() && store.getState().clientDevice.visibleThreadIds.includes(threadId),
      deliver: event => deliverNotification(event, desktopClicksRef.current),
      badge: count => {
        if (isDesktopApp())
          desktopBridge.setBadge(count).catch(error => console.error('Failed to set the badge', error))
      },
      openThread: target => openConversationRef.current(target)
    })
  }

  // Answers that finish while their thread is not on screen.
  useEffect(() => {
    let before = store.getState().gendoxChat.sessions

    return store.subscribe(() => {
      const after = store.getState().gendoxChat.sessions
      if (before === after) return
      const events = completedThreads(before, after)
      before = after
      events.forEach(event => serviceRef.current.publish(event))
    })
  }, [store])

  // A thread on screen in a focused window counts as read.
  useEffect(() => {
    const readVisible = () => {
      if (!pageFocused()) return
      store.getState().clientDevice.visibleThreadIds.forEach(threadId => serviceRef.current.read(threadId))
    }
    readVisible()
    window.addEventListener('focus', readVisible)
    document.addEventListener('visibilitychange', readVisible)

    return () => {
      window.removeEventListener('focus', readVisible)
      document.removeEventListener('visibilitychange', readVisible)
    }
  }, [store, visibleThreadIds])

  // Clicks on the desktop app's notifications.
  useEffect(() => {
    if (!isDesktopApp()) return

    return desktopBridge.onNativeEvent(event => {
      if (event.type !== 'notification') return
      const id = event.action?.notification?.id
      desktopClicksRef.current.get(id)?.()
      desktopClicksRef.current.delete(id)
    })
  }, [])

  return <NotificationsContext.Provider value={serviceRef.current}>{children}</NotificationsContext.Provider>
}

function deliverNotification(event, desktopClicks) {
  if (!isDesktopApp()) return browserNotificationAdapter(window).deliver(event)
  const id = crypto.getRandomValues(new Uint32Array(1))[0] & 0x7fffffff
  desktopClicks.set(id, event.onClick)
  if (desktopClicks.size > 128) desktopClicks.delete(desktopClicks.keys().next().value)

  return desktopBridge.notify({ id, title: event.title, body: event.body })
}

export default NotificationsProvider
