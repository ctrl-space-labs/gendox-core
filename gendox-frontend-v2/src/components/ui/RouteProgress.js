import { useEffect, useRef, useState } from 'react'
import Router from 'next/router'

// a page that opens faster than this shows no bar, so quick moves don't flicker
const SHOW_AFTER_MS = 120

/**
 * A thin bar at the top of the window while the app moves to another page. It creeps towards the end
 * and fills when the page is there. Only page changes: a change of the hash or of the query on the
 * same page (a tab in the agent home, a filter) is not a page load.
 */
const RouteProgress = () => {
  const [progress, setProgress] = useState(null) // null hidden, 0..100
  const timers = useRef({})
  const shown = useRef(false)

  useEffect(() => {
    const clear = () => {
      clearTimeout(timers.current.show)
      clearInterval(timers.current.creep)
      clearTimeout(timers.current.hide)
    }

    const start = (url, { shallow } = {}) => {
      if (shallow) return
      const next = new URL(url, window.location.href)
      if (next.pathname === window.location.pathname) return
      clear()
      timers.current.show = setTimeout(() => {
        shown.current = true
        setProgress(8)
        // slows down as it goes, never reaching the end on its own
        timers.current.creep = setInterval(() => setProgress(p => (p === null ? p : p + (90 - p) * 0.08)), 200)
      }, SHOW_AFTER_MS)
    }

    const done = () => {
      clear()
      if (!shown.current) return
      shown.current = false
      setProgress(100)
      timers.current.hide = setTimeout(() => setProgress(null), 250)
    }

    Router.events.on('routeChangeStart', start)
    Router.events.on('routeChangeComplete', done)
    Router.events.on('routeChangeError', done)

    return () => {
      clear()
      Router.events.off('routeChangeStart', start)
      Router.events.off('routeChangeComplete', done)
      Router.events.off('routeChangeError', done)
    }
  }, [])

  if (progress === null) return null

  return <div className='route-progress' role='progressbar' aria-label='Loading page' style={{ width: `${progress}%` }} />
}

export default RouteProgress
