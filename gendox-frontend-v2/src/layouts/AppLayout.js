import { useEffect, useState } from 'react'
import Head from 'next/head'
import Sidebar from 'src/layouts/components/Sidebar'
import Topbar from 'src/layouts/components/Topbar'
import CommandPalette from 'src/layouts/components/CommandPalette'

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
        <title>{title ? `${title} · Gendox` : 'Gendox'}</title>
      </Head>
      <Sidebar page={page} />
      <div className='main' onClick={() => navOpen && setNavOpen(false)}>
        <Topbar
          title={title}
          crumb={crumb}
          onMenuClick={e => {
            e.stopPropagation()
            setNavOpen(open => !open)
          }}
          onSearchClick={() => setSearchOpen(true)}
        />
        {children}
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

export default AppLayout
