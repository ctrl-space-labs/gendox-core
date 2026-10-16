import { createContext, useContext, useEffect, useState } from 'react'
import Head from 'next/head'
import Sidebar from 'src/layouts/components/Sidebar'
import Topbar from 'src/layouts/components/Topbar'
import CommandPalette from 'src/layouts/components/CommandPalette'

// lets a page change the top bar's title while it is open, e.g. the agent home shows its focused tab
const TitleContext = createContext(() => {})

export const useTopbarTitle = title => {
  const setTitle = useContext(TitleContext)

  useEffect(() => {
    setTitle(title)
  }, [title, setTitle])

  useEffect(() => () => setTitle(null), [setTitle])
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
  const [navOpen, setNavOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [liveTitle, setLiveTitle] = useState(null)
  const shownTitle = liveTitle ?? title

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={`app ${navOpen ? 'nav-open' : ''}`}>
      <Head>
        <title>{shownTitle ? `${shownTitle} · Gendox` : 'Gendox'}</title>
      </Head>
      <Sidebar page={page} />
      <div className='main' onClick={() => navOpen && setNavOpen(false)}>
        <Topbar
          title={shownTitle}
          crumb={crumb}
          onMenuClick={e => {
            e.stopPropagation()
            setNavOpen(open => !open)
          }}
          onSearchClick={() => setSearchOpen(true)}
        />
        <TitleContext.Provider value={setLiveTitle}>{children}</TitleContext.Provider>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

export default AppLayout
