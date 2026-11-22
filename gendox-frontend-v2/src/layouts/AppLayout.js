import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Sidebar from 'src/layouts/components/Sidebar'
import Topbar from 'src/layouts/components/Topbar'
import GendoxAssistant from 'src/components/assistant/GendoxAssistant'
import CommandPalette from 'src/layouts/components/CommandPalette'
import { localStorageConstants } from 'src/utils/generalConstants'

// below this width the sidebar is a drawer opened from the top bar's menu button (see base.css)
const narrowScreen = () => window.matchMedia('(max-width: 900px)').matches

// lets a page change the top bar's title while it is open, e.g. the agent home shows its focused tab
const TitleContext = createContext(() => {})

export const useTopbarTitle = title => {
  const setTitle = useContext(TitleContext)

  useEffect(() => {
    setTitle(title)
  }, [title, setTitle])

  useEffect(() => () => setTitle(null), [setTitle])
}

// lets a page tell the sidebar which tab it shows, e.g. the agent home's focused chat (#/chat/<threadId>)
const FocusedTabContext = createContext(() => {})

export const useFocusedTab = url => {
  const setFocusedTab = useContext(FocusedTabContext)

  useEffect(() => {
    setFocusedTab(url)
  }, [url, setFocusedTab])

  useEffect(() => () => setFocusedTab(null), [setFocusedTab])
}

/**
 * The app shell: sidebar, top bar and ⌘K search around a page.
 * A page uses it through getLayout:
 *   Page.getLayout = page => <AppLayout page='home' title='Home'>{page}</AppLayout>
 *
 * @param page - the id of the sidebar item to highlight (see src/navigation)
 * @param title - shown in the top bar and the browser tab
 * @param crumb - optional parent shown before the title
 */
const AppLayout = ({ page, title, crumb, children }) => {
  const shellRef = useRef(null)
  const chatWorkspace = page === 'chat'
  const [navOpen, setNavOpen] = useState(false)
  const [sideCollapsed, setSideCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [liveTitle, setLiveTitle] = useState(null)
  const [focusedTab, setFocusedTab] = useState(null)
  const shownTitle = liveTitle ?? title

  useEffect(() => {
    const shell = shellRef.current
    const viewport = window.visualViewport
    if (!chatWorkspace || !shell || !viewport) return

    // Mobile WebKit shrinks the visual viewport for the keyboard without resizing the layout viewport.
    const syncViewport = () => {
      if (viewport.scale !== 1) return
      shell.style.setProperty('--chat-viewport-height', `${viewport.height}px`)
      shell.style.setProperty('--chat-viewport-top', `${viewport.offsetTop}px`)
    }
    syncViewport()
    viewport.addEventListener('resize', syncViewport)
    viewport.addEventListener('scroll', syncViewport)

    return () => {
      viewport.removeEventListener('resize', syncViewport)
      viewport.removeEventListener('scroll', syncViewport)
      shell.style.removeProperty('--chat-viewport-height')
      shell.style.removeProperty('--chat-viewport-top')
    }
  }, [chatWorkspace])

  useEffect(() => {
    setSideCollapsed(window.localStorage.getItem(localStorageConstants.sidebarCollapsed) === 'true')
  }, [])

  // One toggle for the sidebar's button, the top bar's button and ⌘B: on a narrow screen it opens and closes the
  // drawer; on a wide one it hides and shows the sidebar, remembered
  const toggleSidebar = () => {
    if (narrowScreen()) return setNavOpen(open => !open)
    setSideCollapsed(collapsed => {
      window.localStorage.setItem(localStorageConstants.sidebarCollapsed, String(!collapsed))

      return !collapsed
    })
  }
  const toggleRef = useRef(toggleSidebar)
  toggleRef.current = toggleSidebar

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      // ⌘B / Ctrl+B, except in an editor where it may mean bold
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'b') {
        if (e.target.closest?.('[contenteditable="true"], .monaco-editor')) return
        e.preventDefault()
        toggleRef.current()
      }
    }
    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div ref={shellRef} className={`app${chatWorkspace ? ' chat-workspace' : ''}${navOpen ? ' nav-open' : ''}${sideCollapsed ? ' side-collapsed' : ''}`}>
      <Head>
        <title>{shownTitle ? `${shownTitle} · Gendox` : 'Gendox'}</title>
      </Head>
      <Sidebar page={page} focusedTab={focusedTab} onToggle={toggleSidebar} />
      <div className='main' onClick={() => navOpen && setNavOpen(false)}>
        <Topbar
          title={shownTitle}
          crumb={crumb}
          onMenuClick={e => {
            e.stopPropagation()
            toggleSidebar()
          }}
          onSearchClick={() => setSearchOpen(true)}
        />
        <TitleContext.Provider value={setLiveTitle}>
          <FocusedTabContext.Provider value={setFocusedTab}>{children}</FocusedTabContext.Provider>
        </TitleContext.Provider>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <GendoxAssistant />
    </div>
  )
}

export default AppLayout
