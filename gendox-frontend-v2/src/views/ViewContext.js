import { createContext, useContext, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'

/**
 * Where a screen is shown: as its own page, or as a tab in the agent home's dock (see src/components/dock).
 * One implementation serves both; the screen reads its parameters and moves through this instead of the router.
 *
 *   mode   'page' | 'dock'
 *   ready  the parameters are known
 *   query  the parameters (the page's URL query, or the tab's)
 *   set(changes)   change parameters in place, e.g. which answer is open; null or '' removes one
 *   open(href)     go to another screen: the page navigates, the dock opens or focuses a tab
 *   ask(text)      start a chat with some text in the message box (the dock only; the page shows its own panel)
 *   setTitle(text) name the tab (the dock only; a page sets its <title>)
 */
const ViewContext = createContext(null)

export const ViewProvider = ViewContext.Provider

export const useView = () => {
  const dock = useContext(ViewContext)
  const router = useRouter()

  const page = useMemo(
    () => ({
      mode: 'page',
      ready: router.isReady,
      query: router.query,
      set: changes => {
        const query = { ...router.query }
        Object.entries(changes).forEach(([key, value]) => {
          if (value == null || value === '') delete query[key]
          else query[key] = value
        })
        router.replace({ pathname: router.pathname, query }, undefined, { shallow: true, scroll: false })
      },
      open: href => router.push(href),
      ask: null
    }),
    [router]
  )

  return dock ?? page
}

/** The name of what the screen shows, e.g. the task's title, for its dock tab */
export const useScreenTitle = title => {
  const { setTitle } = useView()

  useEffect(() => {
    if (title && setTitle) setTitle(title)
  }, [title, setTitle])
}

/**
 * The outer element of a screen, with its .vw container (layouts follow the view's own width):
 * <main className='content'> on a page, the tab's box in the dock.
 * `fill` makes it take the height it is given (a table with its own scroller, like Document insights).
 */
export const ViewMain = ({ fill = false, children }) => {
  const view = useView()
  const vw = `vw in-${view.mode} ${fill ? 'fill' : ''}`

  if (view.mode === 'dock') return <div className={vw}>{children}</div>

  return (
    <main className={`content ${fill ? 'app-page' : ''}`}>
      <div className={vw}>{children}</div>
    </main>
  )
}

/** Scroll an element into view inside its own scroller (a dock window), never the page around it */
export const scrollWithin = (el, at = 1 / 3) => {
  if (!el) return
  const scroller = el.closest('.group-b')
  if (!scroller) return el.scrollIntoView({ block: at < 0.2 ? 'start' : 'center' })
  scroller.scrollTop += el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - scroller.clientHeight * at
}
