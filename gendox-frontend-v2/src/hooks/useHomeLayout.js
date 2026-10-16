import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'gx-home'
const EVENT = 'gx-home-change'
export const HOME_LAYOUTS = ['org', 'agent']

const read = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)

    return HOME_LAYOUTS.includes(saved) ? saved : 'org'
  } catch {
    return 'org'
  }
}

/**
 * Which home the user works from: 'org' (the organization overview, everything in the sidebar) or
 * 'agent' (inside one agent: the chat-first workspace with its windows, recent chats in the sidebar).
 * Both are built while the team decides which one stays; the choice is kept in the browser.
 */
const useHomeLayout = () => {
  const [layout, setLayoutState] = useState('org')

  useEffect(() => {
    setLayoutState(read())
    const sync = () => setLayoutState(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener('storage', sync)

    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const setLayout = useCallback(next => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {}
    setLayoutState(next)
    window.dispatchEvent(new Event(EVENT))
  }, [])

  return [layout, setLayout]
}

/** Where Home leads in a layout */
export const homePathOf = layout => (layout === 'agent' ? '/gendox/agent-home' : '/gendox/home')

export default useHomeLayout
