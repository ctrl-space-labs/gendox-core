import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowUpRight, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from 'src/authentication/useAuth'
import useActiveScope from 'src/hooks/useActiveScope'
import useThemePreference from 'src/hooks/useThemePreference'
import commonConfig from 'src/configs/common.config'
import userService from 'src/gendox-sdk/userService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import { roleInOrganization, roleTitle } from 'src/components/agent/roles'
import AppLayout from 'src/layouts/AppLayout'
import Avatar from 'src/components/ui/Avatar'
import MenuList from 'src/components/ui/MenuList'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'

// Keycloak's account console: password, two-step verification, sessions
const ACCOUNT_URL = `${commonConfig.oidcAuthority}/account`

const THEMES = [
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['system', 'Match system']
]

/**
 * The signed-in user: details from GET profile (read-only, as before), organizations, appearance, sign out,
 * and deleting the account (PUT users/{id}/deactivate, then sign out).
 */
const UserProfilePage = () => {
  const { user, logout } = useAuth()
  const { organizationId, href } = useActiveScope()
  const [theme, setTheme] = useThemePreference()
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!user) return null

  const organizations = user.organizations ?? []
  const owned = organizations.filter(o => roleInOrganization(o) === 'ROLE_OWNER').map(o => o.name)

  const deleteAccount = async () => {
    try {
      await userService.deactivateUserById(user.id, getToken())
      toast.success('Your account was deleted')
      logout()
    } catch (error) {
      toast.error(`Couldn’t delete your account. ${getErrorMessage(error)}`)
    }
  }

  const detail = (label, value) =>
    value ? (
      <>
        <dt>{label}</dt>
        <dd>{value}</dd>
      </>
    ) : null

  return (
    <main className='content' style={{ maxWidth: 1000 }}>
      <div className='scope-top'>
        <Avatar name={user.name || user.email} seed={user.id} size='l' round />
        <div>
          <h1 style={{ fontSize: 24 }}>{user.name || user.email}</h1>
          <p className='muted sm'>{user.email}</p>
        </div>
      </div>
      <div>
        <section className='sect'>
          <header>
            <h2>Your details</h2>
            <p>Shown to your team in member lists and conversations.</p>
          </header>
          <div className='card'>
            <div className='card-b'>
              <dl className='kv'>
                {detail('First name', user.firstName)}
                {detail('Last name', user.lastName)}
                {!user.firstName && !user.lastName && detail('Name', user.name)}
                {detail('Email', user.email)}
                {detail('Phone', user.phone)}
              </dl>
            </div>
            {user.userName && (
              <div className='card-f faint sm'>
                Username <span className='mono'>{user.userName}</span>
              </div>
            )}
          </div>
        </section>

        <section className='sect'>
          <header>
            <h2>Sign-in & security</h2>
            <p>Your password and sign-in methods are managed by the Gendox account service.</p>
          </header>
          <div className='card'>
            <a className='item' href={ACCOUNT_URL} target='_blank' rel='noopener noreferrer'>
              <span className='ftype' style={{ '--h': 210 }}>
                <ShieldCheck className='lucide' />
              </span>
              <div style={{ flex: 1 }}>
                <div>Password and two-step verification</div>
                <div className='faint sm'>Opens your Gendox account</div>
              </div>
              <ArrowUpRight className='lucide' />
            </a>
            <button className='item' onClick={() => logout()}>
              <span className='ftype' style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                <LogOut className='lucide' />
              </span>
              <div style={{ flex: 1 }}>Sign out</div>
            </button>
          </div>
        </section>

        <section className='sect'>
          <header>
            <h2>Organizations</h2>
            <p>Switch between them from the menu at the bottom of the sidebar.</p>
          </header>
          <div className='card'>
            <MenuList items={organizations} currentId={organizationId} noun='organizations' toggleClassName='item'>
              {o => {
                const current = o.id === organizationId

                return (
                  <div className='item' key={o.id}>
                    <Avatar name={o.name} seed={o.id} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500 }}>
                        {o.name} {current && <span className='badge accent'>Current</span>}
                      </div>
                      <div className='faint sm'>
                        {roleTitle(roleInOrganization(o))} · {o.projects?.length ?? 0}{' '}
                        {o.projects?.length === 1 ? 'agent' : 'agents'}
                      </div>
                    </div>
                    {current ? (
                      <Link className='btn ghost s' href={href('/gendox/organization-settings')}>
                        Settings
                      </Link>
                    ) : (
                      <Link className='btn s' href={`/gendox/agent-home/?organizationId=${o.id}`}>
                        Switch
                      </Link>
                    )}
                  </div>
                )
              }}
            </MenuList>
            <div className='card-f'>
              <Link className='btn ghost s' href='/gendox/create-organization'>
                Create organization
              </Link>
            </div>
          </div>
        </section>

        <section className='sect'>
          <header>
            <h2>Appearance</h2>
            <p>Saved on this device.</p>
          </header>
          <div className='card card-b'>
            <div className='pill-tabs'>
              {THEMES.map(([value, label]) => (
                <button key={value} className={theme === value ? 'on' : ''} onClick={() => setTheme(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className='sect'>
          <header>
            <h2>Delete account</h2>
          </header>
          <div className='card danger-zone'>
            <div className='item'>
              <div style={{ flex: 1 }}>
                <b>Delete your account</b>
                <div className='muted sm'>
                  You leave every organization and are signed out.
                  {owned.length > 0 && ` You own ${owned.join(', ')}: make someone else an owner first, or delete it.`}
                </div>
              </div>
              <button className='btn danger' onClick={() => setDeleteOpen(true)}>
                Delete account
              </button>
            </div>
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title='Delete your account?'
        text={
          owned.length
            ? `You own ${owned.join(', ')}. Without another owner, no one can manage ${
                owned.length === 1 ? 'it' : 'them'
              } after you leave. This can’t be undone.`
            : 'You leave every organization and lose access to their agents. This can’t be undone.'
        }
        confirmLabel='Delete account'
        onConfirm={deleteAccount}
      />
    </main>
  )
}

UserProfilePage.getLayout = page => (
  <AppLayout page='profile' title='Profile'>
    {page}
  </AppLayout>
)

UserProfilePage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default UserProfilePage
