import Link from 'next/link'
import {
  BookOpen,
  Building2,
  Cable,
  Check,
  ChevronsUpDown,
  CreditCard,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Sun,
  User,
  Users
} from 'lucide-react'
import { useAuth } from 'src/authentication/useAuth'
import useActiveScope from 'src/hooks/useActiveScope'
import useThemePreference from 'src/hooks/useThemePreference'
import commonConfig from 'src/configs/common.config'
import { sortByField } from 'src/utils/orderUtils'
import Avatar from 'src/components/ui/Avatar'
import Menu from 'src/components/ui/Menu'

const themes = [
  { id: 'light', icon: Sun },
  { id: 'dark', icon: Moon },
  { id: 'system', icon: Monitor }
]

// the organization's pages; one without a path has not moved to this app yet
const organizationPages = [
  { title: 'Organization settings', icon: Building2, path: '/gendox/organization-settings' },
  { title: 'Members', icon: Users, path: '/gendox/organization-members' },
  { title: 'Integrations', icon: Cable, path: '/gendox/integrations' },
  { title: 'API keys', icon: KeyRound, path: '/gendox/api-keys' },
  { title: 'Plan & usage', icon: CreditCard, path: '/gendox/plan' }
]

const AccountMenu = () => {
  const { user, logout } = useAuth()
  const { organizations, organization, href } = useActiveScope()
  const [theme, setTheme] = useThemePreference()

  const sortedOrganizations = sortByField([...organizations], 'name', organization?.id)

  return (
    <Menu
      up
      trigger={({ onClick }) => (
        <button className='account' onClick={onClick}>
          <Avatar name={user?.name} seed={user?.id} size='s' round />
          <span className='trunc' style={{ flex: 1 }}>
            {user?.name}
            <small>{organization?.name}</small>
          </span>
          <ChevronsUpDown className='lucide' />
        </button>
      )}
    >
      <div className='h'>{user?.email}</div>
      {sortedOrganizations.map(o => (
        <Link
          key={o.id}
          className='mi'
          href={href('/gendox/home', { organizationId: o.id, projectId: undefined })}
        >
          <Avatar name={o.name} seed={o.id} size='s' />
          <span className='trunc' style={{ flex: 1 }}>
            {o.name}
          </span>
          {o.id === organization?.id && <Check className='lucide' />}
        </Link>
      ))}
      <Link className='mi' href='/gendox/create-organization'>
        <Plus className='lucide' />
        Create organization
      </Link>
      <hr />
      {organizationPages.map(({ title, icon: Icon, path }) =>
        path ? (
          <Link key={title} className='mi' href={href(path)}>
            <Icon className='lucide' />
            {title}
          </Link>
        ) : (
          <span key={title} className='mi soon'>
            <Icon className='lucide' />
            {title}
          </span>
        )
      )}
      <hr />
      <div className='row' style={{ padding: '4px 10px' }}>
        <span className='muted sm' style={{ flex: 1 }}>
          Theme
        </span>
        <div className='seg'>
          {themes.map(({ id, icon: Icon }) => (
            <button key={id} title={id} className={id === theme ? 'on' : ''} onClick={() => setTheme(id)}>
              <Icon className='lucide' />
            </button>
          ))}
        </div>
      </div>
      <hr />
      <Link className='mi' href={href('/gendox/user-profile')}>
        <User className='lucide' />
        Profile
      </Link>
      <a className='mi' href={commonConfig.gendoxDocsUrl} target='_blank' rel='noreferrer'>
        <BookOpen className='lucide' />
        Documentation
      </a>
      <button className='mi' data-close-menu onClick={() => logout()}>
        <LogOut className='lucide' />
        Sign out
      </button>
    </Menu>
  )
}

export default AccountMenu
