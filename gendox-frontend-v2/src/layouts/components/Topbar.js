import { ChevronRight, CircleHelp, Menu as MenuIcon, Search, Server } from 'lucide-react'
import commonConfig from 'src/configs/common.config'

// The server this page talks to, shown only when its domain differs from the page's (mainly in development)
const otherServer = () => {
  if (typeof window === 'undefined' || !window.__GENDOX_ENV__?.GENDOX_WEB) return null
  const api = new URL(commonConfig.gendoxUrl)

  return api.hostname === window.location.hostname ? null : api.host
}

const Topbar = ({ title, crumb, onMenuClick, onSearchClick }) => {
  const server = otherServer()

  return (
    <header className='topbar' data-tauri-drag-region='deep'>
      <button className='btn ghost icon menu-btn' aria-label='Menu' onClick={onMenuClick}>
        <MenuIcon className='lucide' />
      </button>
      {/* a page can put its own button here, see TopbarSlot */}
      <span id='topbar-slot' style={{ display: 'contents' }} />
      <div className='crumbs'>
        {crumb && (
          <>
            <span className='hide-sm'>{crumb}</span>
            <span className='hide-sm'>
              <ChevronRight className='lucide' />
            </span>
          </>
        )}
        <b>{title}</b>
      </div>
      <span className='sp' />
      {server && (
        <span className='badge warn' title={`This page talks to the Gendox server at ${server}`}>
          <Server className='lucide' />
          <span className='hide-sm'>Server:</span> {server}
        </span>
      )}
      {/* a page's own controls before Search, see TopbarSlot at='end' */}
      <span id='topbar-end' style={{ display: 'contents' }} />
      <button className='search-btn' onClick={onSearchClick}>
        <Search className='lucide' />
        <span className='hide-sm'>Search</span>
        <span className='kbd hide-sm'>⌘K</span>
      </button>
      <a
        className='btn ghost icon'
        aria-label='Help'
        href={commonConfig.gendoxDocsUrl}
        target='_blank'
        rel='noreferrer'
        title='Documentation'
      >
        <CircleHelp className='lucide' />
      </a>
    </header>
  )
}

export default Topbar
