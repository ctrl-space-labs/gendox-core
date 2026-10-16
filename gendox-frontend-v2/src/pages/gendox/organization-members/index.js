import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Check, ChevronDown, Info, Link as LinkIcon, Mail, MailPlus, Search, UserMinus } from 'lucide-react'
import { useAuth } from 'src/authentication/useAuth'
import useActiveScope from 'src/hooks/useActiveScope'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import {
  fetchOrganizationMembers,
  fetchOrganizationPlans,
  removeOrganizationMember,
  updateMemberRole
} from 'src/store/activeOrganization/activeOrganization'
import invitationService from 'src/gendox-sdk/invitationService'
import { hasPlanFeature, planFeatureMessages, planFeatures } from 'src/configs/planFeatures'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import { ROLES, grantableRoles, roleInOrganization, roleTitle } from 'src/components/agent/roles'
import { formatDate } from 'src/components/knowledge/documentUtils'
import OrgScope from 'src/components/organization/OrgScope'
import AppLayout from 'src/layouts/AppLayout'
import Avatar from 'src/components/ui/Avatar'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Dialog from 'src/components/ui/Dialog'
import Menu from 'src/components/ui/Menu'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RANK = { ROLE_OWNER: 4, ROLE_ADMIN: 3, ROLE_EDITOR: 2, ROLE_READER: 1 }
const USER_TYPES = { GENDOX_USER: 'Person', DISCORD_USER: 'Discord' }

// Invitations always name an agent (projectId is required): the person joins the organization through it
const InviteDialog = ({ open, onClose, organizationName, projects, roles, canInvite, onInvite }) => {
  const [emails, setEmails] = useState('')
  const [role, setRole] = useState('')
  const [projectId, setProjectId] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!open) return
    setEmails('')
    setError('')
    setRole(roles.includes('ROLE_EDITOR') ? 'ROLE_EDITOR' : roles[0] ?? '')
    setProjectId(projects[0]?.id ?? '')
  }, [open])

  const send = async () => {
    const list = emails
      .split(',')
      .map(e => e.trim())
      .filter(Boolean)
    if (list.length === 0 || !list.every(e => EMAIL.test(e))) return setError('Check the email addresses.')
    setIsSending(true)
    const sent = await onInvite(list, role, projectId)
    setIsSending(false)
    if (sent) onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Invite people to ${organizationName}`}
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button className='btn primary' onClick={send} disabled={!canInvite || !role || !projectId || isSending}>
            {isSending ? 'Sending…' : 'Send invitations'}
          </button>
        </>
      }
    >
      <div className='form'>
        <div className='field'>
          <label>Emails</label>
          <input
            className='input'
            placeholder='name@company.com, another@company.com'
            value={emails}
            onChange={e => {
              setEmails(e.target.value)
              setError('')
            }}
          />
          <span className='help'>Separate several with commas.</span>
          {error && <span className='err'>{error}</span>}
        </div>
        <div className='form-grid'>
          <div className='field'>
            <label>Role</label>
            <select className='input' value={role} onChange={e => setRole(e.target.value)}>
              {roles.map(r => (
                <option key={r} value={r}>
                  {ROLES[r][0]}
                </option>
              ))}
            </select>
          </div>
          <div className='field'>
            <label>Starts with agent</label>
            <select className='input' value={projectId} onChange={e => setProjectId(e.target.value)}>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className='help'>Add more agents after they join.</span>
          </div>
        </div>
        <p className='faint sm'>They get an email with a link to join.</p>
        {!canInvite && (
          <div className='alert' style={{ '--c': 'var(--warn)' }}>
            <b>Upgrade to invite people</b>
            <span className='muted'>{planFeatureMessages[planFeatures.INVITE_USERS]}</span>
          </div>
        )}
      </div>
    </Dialog>
  )
}

/**
 * The organization's members: GET organizations/{o}/users (agent users hidden).
 * Change a role: PUT …/users/{u}/roles; remove: DELETE …/users/{u}. You can give roles up to your own.
 */
const OrganizationMembersPage = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const { organization, organizationId, projects } = useActiveScope()
  const { organizationMembers, organizationPlans } = useSelector(state => state.activeOrganization)

  const canInviteRole = useHasOrgRole({ organizationId, roles: ['OP_ADD_USERS'] })
  const canRemove = useHasOrgRole({ organizationId, roles: ['OP_REMOVE_USERS'] })
  const canInvite = hasPlanFeature(organizationPlans?.subscriptionPlan?.sku, planFeatures.INVITE_USERS)

  const [query, setQuery] = useState('')
  const [invitations, setInvitations] = useState([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [removing, setRemoving] = useState(null)

  const organizationName = organization?.name || 'the organization'
  const myRole = roleInOrganization(organization)
  const myRank = RANK[myRole] ?? 0

  const loadInvitations = useCallback(() => {
    if (!organizationId || !canInviteRole) return
    invitationService
      .getProjectInvitations(organizationId, null, getToken(), {
        statusName: 'PENDING',
        page: 0,
        size: 100,
        sort: 'createdAt,desc'
      })
      .then(response => setInvitations(response.data?.content ?? []))
      .catch(() => setInvitations([]))
  }, [organizationId, canInviteRole])

  useEffect(() => {
    if (!organizationId) return
    dispatch(fetchOrganizationMembers({ organizationId, token: getToken() }))
    dispatch(fetchOrganizationPlans({ organizationId, token: getToken() }))
    loadInvitations()
  }, [dispatch, organizationId, loadInvitations])

  const members = useMemo(() => {
    const value = query.trim().toLowerCase()

    return (organizationMembers || [])
      .filter(m => m.user?.userType?.name !== 'GENDOX_AGENT' && m.user?.email)
      .filter(m => `${m.user.name || ''} ${m.user.email || ''} ${m.user.userName || ''}`.toLowerCase().includes(value))
  }, [organizationMembers, query])

  const seats = organizationPlans?.numberOfSeats

  const changeRole = (member, role) =>
    dispatch(
      updateMemberRole({
        organizationId,
        userId: member.user.id,
        data: { userOrganizationId: member.id, roleName: role },
        token: getToken()
      })
    )
      .unwrap()
      .then(() => {
        toast.success(`${member.user.name || member.user.email} is now ${roleTitle(role)}`)
        dispatch(fetchOrganizationMembers({ organizationId, token: getToken() }))
      })
      .catch(() => {})

  const remove = member =>
    dispatch(removeOrganizationMember({ organizationId, userId: member.user.id, token: getToken() }))
      .unwrap()
      .then(() => toast.success(`${member.user.name || member.user.email} removed`))
      .catch(() => {})

  const invite = async (emails, role, projectId) => {
    try {
      for (const email of emails) {
        await invitationService.inviteProjectMember(organizationId, getToken(), {
          inviteeEmail: email,
          projectId,
          organizationId,
          userRoleType: { name: role },
          inviterUserId: user.id
        })
      }
      toast.success(emails.length === 1 ? 'Invitation sent' : `${emails.length} invitations sent`)
      loadInvitations()

      return true
    } catch (error) {
      toast.error(`Couldn’t send the invitations. ${getErrorMessage(error)}`)
      loadInvitations()

      return false
    }
  }

  const agentName = id => projects.find(p => p.id === id)?.name

  return (
    <main className='content'>
      <OrgScope tab='members' />

      <div className='list-h'>
        <label className='search' style={{ minWidth: 240, flex: 1, maxWidth: 360 }}>
          <Search className='lucide' />
          <input placeholder='Find people' value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <span className='sp' />
        {seats > 0 && (
          <span className='faint sm'>
            {members.length} of {seats} seats
          </span>
        )}
        {canInviteRole && (
          <button className='btn primary' onClick={() => setInviteOpen(true)}>
            <MailPlus className='lucide' />
            Invite people
          </button>
        )}
      </div>

      <div className='card'>
        <div className='scroll'>
          <table className='table'>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th className='hide-sm'>Type</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                const role = member.role?.name
                const isMe = member.user.id === user?.id
                const canChange = !isMe && myRank > 1 && myRank >= (RANK[role] ?? 0)

                return (
                  <tr key={member.id} style={{ cursor: 'default' }}>
                    <td>
                      <div className='row' style={{ gap: 10 }}>
                        <Avatar name={member.user.name || member.user.email} seed={member.user.id} size='s' round />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500 }}>
                            {member.user.name || member.user.email}
                            {isMe && <span className='faint sm'> (you)</span>}
                          </div>
                          <div className='faint sm'>{member.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {canChange ? (
                        <Menu
                          width={300}
                          trigger={({ onClick }) => (
                            <button className='btn ghost s' onClick={onClick}>
                              {roleTitle(role)}
                              <ChevronDown className='lucide' />
                            </button>
                          )}
                        >
                          <div className='h'>Role of {member.user.name || member.user.email}</div>
                          {grantableRoles(myRole).map(r => (
                            <button
                              key={r}
                              className='mi tall'
                              data-close-menu
                              style={{ height: 'auto', padding: '8px 10px', width: '100%', textAlign: 'left' }}
                              onClick={() => r !== role && changeRole(member, r)}
                            >
                              <span style={{ flex: 1 }}>
                                <b style={{ fontWeight: 500, display: 'block' }}>{ROLES[r][0]}</b>
                                <span className='faint sm'>{ROLES[r][1]}</span>
                              </span>
                              {r === role && <Check className='lucide' />}
                            </button>
                          ))}
                        </Menu>
                      ) : (
                        <span className='role'>{roleTitle(role)}</span>
                      )}
                    </td>
                    <td className='hide-sm'>
                      <span className='badge'>{USER_TYPES[member.user.userType?.name] ?? 'Person'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {canRemove && !isMe && role !== 'ROLE_OWNER' && (
                        <button
                          className='btn ghost s icon'
                          title={`Remove from ${organizationName}`}
                          onClick={() => setRemoving(member)}
                        >
                          <UserMinus className='lucide' />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {canInviteRole && (
        <div className='card'>
          <div className='card-h'>
            <h3>Pending invitations</h3>
            <span className='faint sm'>{invitations.length}</span>
          </div>
          {invitations.length > 0 ? (
            invitations.map(invitation => (
              <div className='item' key={invitation.id}>
                <span className='avatar s round' style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
                  <Mail className='lucide' />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className='trunc'>{invitation.inviteeEmail}</div>
                  <div className='faint sm'>
                    {[
                      roleTitle(invitation.userRoleType?.name),
                      agentName(invitation.projectId),
                      invitation.expiresAt ? `expires ${formatDate(invitation.expiresAt)}` : null
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <span className='badge dot warn'>Pending</span>
                {invitation.invitationLink && (
                  <button
                    className='btn ghost s'
                    onClick={() =>
                      navigator.clipboard
                        ?.writeText(invitation.invitationLink)
                        .then(() => toast.success('Invitation link copied'))
                    }
                  >
                    <LinkIcon className='lucide' />
                    <span className='hide-sm'>Copy link</span>
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className='card-b faint sm'>No pending invitations.</div>
          )}
        </div>
      )}

      <details className='card card-b'>
        <summary className='row' style={{ cursor: 'pointer', listStyle: 'none' }}>
          <Info className='lucide' />
          <b style={{ fontWeight: 500 }}>What each role can do</b>
        </summary>
        <dl className='kv' style={{ marginTop: 14 }}>
          {Object.entries(ROLES).map(([key, [title, text]]) => (
            <div key={key} style={{ display: 'contents' }}>
              <dt className='role'>{title}</dt>
              <dd className='muted'>{text}</dd>
            </div>
          ))}
        </dl>
      </details>

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        organizationName={organizationName}
        projects={projects}
        roles={grantableRoles(myRole)}
        canInvite={canInvite}
        onInvite={invite}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.user?.name || removing?.user?.email || ''} from ${organizationName}?`}
        text='They lose access to every agent in the organization. Their documents and conversations stay.'
        confirmLabel='Remove'
        onConfirm={() => remove(removing)}
      />
    </main>
  )
}

OrganizationMembersPage.getLayout = page => (
  <AppLayout page='organization' title='Members' crumb='Organization'>
    {page}
  </AppLayout>
)

OrganizationMembersPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default OrganizationMembersPage
