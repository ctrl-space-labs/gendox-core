import Link from 'next/link'
import navigation from 'src/navigation'
import useActiveScope from 'src/hooks/useActiveScope'
import AccountMenu from 'src/layouts/components/AccountMenu'

const Sidebar = ({ page }) => {
  const { href } = useActiveScope()

  return (
    <aside className='sidebar'>
      <div className='side-head'>
        <Link className='brand' href={href('/gendox/home')}>
          <span className='mark'>G</span>
          Gendox
        </Link>
      </div>
      <div className='side-nav'>
        {navigation.map((group, index) => (
          <div key={group.label ?? index}>
            {group.label && <div className='nav-label'>{group.label}</div>}
            <nav className='nav'>
              {group.items.map(({ id, title, icon: Icon, path }) =>
                path ? (
                  <Link key={id} href={href(path)} className={id === page ? 'active' : ''}>
                    <Icon className='lucide' />
                    {title}
                  </Link>
                ) : (
                  <a key={id} className='soon' aria-disabled='true' title='Not in the new frontend yet'>
                    <Icon className='lucide' />
                    {title}
                  </a>
                )
              )}
            </nav>
          </div>
        ))}
      </div>
      <div className='side-foot'>
        <AccountMenu />
      </div>
    </aside>
  )
}

export default Sidebar
