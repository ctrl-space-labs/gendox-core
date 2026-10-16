import { ChevronRight, CircleHelp, Menu as MenuIcon, Search } from 'lucide-react'
import commonConfig from 'src/configs/common.config'

const Topbar = ({ title, crumb, onMenuClick, onSearchClick }) => {
  return (
    <header className='topbar'>
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
