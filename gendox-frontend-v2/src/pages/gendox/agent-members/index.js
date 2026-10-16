import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { Link as LinkIcon, Mail, MailPlus, UserRoundPlus } from 'lucide-react'
import { useAuth } from 'src/authentication/useAuth'
import useHasOrgRole from 'src/authentication/hooks/useHasOrgRole'
import { fetchProjectInvitations, fetchProjectMembersAndRoles } from 'src/store/activeProject/activeProject'
import { fetchOrganizationMembers, fetchOrganizationPlans } from 'src/store/activeOrganization/activeOrganization'
import invitationService from 'src/gendox-sdk/invitationService'
import projectService from 'src/gendox-sdk/projectService'
import { hasPlanFeature, planFeatureMessages, planFeatures } from 'src/configs/planFeatures'
import { getErrorMessage } from 'src/utils/errorHandler'
import useAgent, { getToken } from 'src/components/agent/useAgent'
import AgentScope from 'src/components/agent/AgentScope'
import { ROLES, grantableRoles, roleInOrganization, roleTitle } from 'src/components/agent/roles'
import { formatDate } from 'src/components/knowledge/documentUtils'
import AppLayout from 'src/layouts/AppLayout'
import Avatar from 'src/components/ui/Avatar'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Dialog from 'src/components/ui/Dialog'
import Spinner from 'src/components/ui/Spinner'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USER_TYPES = { GENDOX_USER: 'Person', DISCORD_USER: 'Discord' }

const InviteDialog = ({ open, onClose, agentName, organizationName, roles, canInvite, onInvite }) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!open) return
    setEmail('')
    setError('')
    setRole(roles.includes('ROLE_EDITOR') ? 'ROLE_EDITOR' : roles[0] ?? '')
  }, [open])

  const send = async () => {
    if (!EMAIL.test(email.trim())) return setError('Enter a valid email address.')
    setIsSending(true)
    const sent = await onInvite(email.trim(), role)
    setIsSending(false)
    if (sent) onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Invite to ${agentName}`}
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button className='btn primary' onClick={send} disabled={!canInvite || !role || isSending}>
            {isSending ? 'Sending…' : 'Send invitation'}
          </button>
        </>
      }
    >
      <div className='form'>
        <div className='field'>
          <label>Email</label>
          <input
            className='input'
            type='email'
            placeholder='name@company.com'
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              setError('')
            }}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          {error && <span className='err'>{error}</span>}
        </div>
        <div className='field'>
          <span className='lab'>Role in {organizationName}</span>
          <div className='choice' style={{ gridTemplateColumns: '1fr 1fr' }}>
            {roles.map(r => (
              <label key={r}>
                <input type='radio' name='invite-role' checked={role === r} onChange={() => setRole(r)} />
                <b>{ROLES[r][0]}</b>
                <span>{ROLES[r][1]}</span>
              </label>
            ))}
          </div>
          <span className='help'>Someone already in {organizationName} keeps the role they have.</span>
        </div>
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

const AddMembersDialog = ({ open, onClose, people, organizationName, onAdd }) => {
  const [chosen, setChosen] = useState(() => new Set())
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    if (open) setChosen(new Set())
  }, [open])

  const toggle = id =>
    setChosen(set => {
      const next = new Set(set)
      next.has(id) ? next.delete(id) : next.add(id)

      return next
    })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size='s'
      title={`Add people from ${organizationName}`}
      footer={
        <>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button
            className='btn primary'
            disabled={chosen.size === 0 || isAdding}
            onClick={async () => {
              setIsAdding(true)
              await onAdd([...chosen])
              setIsAdding(false)
              onClose()
            }}
          >
            {isAdding ? 'Adding…' : 'Add'}
          </button>
        </>
      }
    >
      {people.length > 0 ? (
        people.map(member => (
          <label className='check' key={member.user.id} style={{ padding: '8px 0' }}>
            <input type='checkbox' checked={chosen.has(member.user.id)} onChange={() => toggle(member.user.id)} />
            <div className='row' style={{ gap: 10 }}>
              <Avatar name={member.user.name || member.user.email} seed={member.user.id} size='s' round />
              <div>
                <b>{member.user.name || member.user.email}</b>
                <span className='faint sm'>{roleTitle(member.role?.name)}</span>
              </div>
            </div>
          </label>
        ))
      ) : (
        <p className='muted'>Everyone in {organizationName} already has access.</p>
      )}
    </Dialog>
  )
}

/**
 * Who can use the agent. GET …/projects/{p}/users (agent users hidden), add organization members with
 * POST …/projects/{p}/members, remove with DELETE …/projects/{p}/users/{u}.
 * Invitations: POST organizations/{o}/invitations, listed with GET …/invitations?projectId.
 */
const AgentMembersPage = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const { project, organization, organizationId, projectId } = useAgent()
  const { projectMembersAndRoles, isMembersLoading, projectInvitations } = useSelector(state => state.activeProject)
  const { organizationMembers, organizationPlans } = useSelector(state => state.activeOrganization)

  const canManage = useHasOrgRole({ organizationId, roles: ['OP_ADD_PROJECT_MEMBERS'] })
  const canRemove = useHasOrgRole({ organizationId, roles: ['OP_REMOVE_PROJECT_MEMBERS'] })
  const canInvite = hasPlanFeature(organizationPlans?.subscriptionPlan?.sku, planFeatures.INVITE_USERS)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [removing, setRemoving] = useState(null)

  const organizationName = organization?.name || 'the organization'
  const agentName = project?.name || 'this agent'

  const loadInvitations = useCallback(() => {
    if (!canManage || !projectId) return
    dispatch(
      fetchProjectInvitations({
        organizationId,
        projectId,
        token: getToken(),
        params: { projectId, statusNames: ['PENDING'], page: 0, size: 100, sort: 'createdAt,desc' }
      })
    )
  }, [dispatch, canManage, organizationId, projectId])

  const loadMembers = useCallback(() => {
    if (!organizationId || !projectId) return
    dispatch(fetchProjectMembersAndRoles({ organizationId, projectId, token: getToken() }))
  }, [dispatch, organizationId, projectId])

  useEffect(() => {
    if (!organizationId || !projectId) return
    loadMembers()
    loadInvitations()
    dispatch(fetchOrganizationMembers({ organizationId, token: getToken() }))
    dispatch(fetchOrganizationPlans({ organizationId, token: getToken() }))
  }, [dispatch, organizationId, projectId, loadMembers, loadInvitations])

  // people, not the agent's own user
  const members = useMemo(
    () => (projectMembersAndRoles || []).filter(m => m.userType !== 'GENDOX_AGENT'),
    [projectMembersAndRoles]
  )

  const others = useMemo(
    () =>
      (organizationMembers || []).filter(
        m => m.user?.email && !members.some(member => member.id === m.user.id)
      ),
    [organizationMembers, members]
  )

  const invitations = (projectInvitations?.content || []).filter(i => i.statusType?.name === 'PENDING')
  const myRole = roleInOrganization(organization)

  const invite = async (email, role) => {
    const existing = (organizationMembers || []).find(m => m.user?.email === email)
    try {
      await invitationService.inviteProjectMember(organizationId, getToken(), {
        inviteeEmail: email,
        projectId,
        organizationId,
        userRoleType: { name: existing ? existing.role.name : role },
        inviterUserId: user.id
      })
      toast.success('Invitation sent')
      loadInvitations()

      return true
    } catch (error) {
      toast.error(`Couldn’t send the invitation. ${getErrorMessage(error)}`)

      return false
    }
  }

  const addMembers = async userIds => {
    try {
      await projectService.addProjectMember(organizationId, projectId, userIds, getToken())
      toast.success(userIds.length === 1 ? 'Added to this agent' : `${userIds.length} people added`)
      loadMembers()
    } catch (error) {
      toast.error(`Couldn’t add them. ${getErrorMessage(error)}`)
    }
  }

  const remove = async member => {
    try {
      await projectService.removeProjectMember(organizationId, projectId, member.id, getToken())
      toast.success('Removed from this agent')
      loadMembers()
    } catch (error) {
      toast.error(`Couldn’t remove them. ${getErrorMessage(error)}`)
    }
  }

  if (!project) {
    return (
      <main className='content'>
        <div className='center' style={{ padding: 80 }}>
          <Spinner />
        </div>
      </main>
    )
  }

  return (
    <main className='content'>
      <AgentScope project={project} tab='members' />

      <div className='list-h'>
        <div>
          <h2>Who can use this agent</h2>
          <p className='muted' style={{ marginTop: 4 }}>
            Members of {organizationName} with access to {agentName}. Their role is set for the whole organization.
          </p>
        </div>
        <span className='sp' />
        {canManage && (
          <>
            <button className='btn' onClick={() => setAddOpen(true)}>
              <UserRoundPlus className='lucide' />
              Add from organization
            </button>
            <button className='btn primary' onClick={() => setInviteOpen(true)}>
              <MailPlus className='lucide' />
              Invite by email
            </button>
          </>
        )}
      </div>

      <div className='card'>
        <div className='scroll'>
          <table className='table'>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role in {organizationName}</th>
                <th className='hide-sm'>Type</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id} style={{ cursor: 'default' }}>
                  <td>
                    <div className='row' style={{ gap: 10 }}>
                      <Avatar name={member.name || member.email} seed={member.id} size='s' round />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }}>
                          {member.name || member.email}
                          {member.id === user?.id && <span className='faint sm'> (you)</span>}
                        </div>
                        <div className='faint sm'>{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{roleTitle(member.role?.name)}</td>
                  <td className='hide-sm'>
                    <span className='badge'>{USER_TYPES[member.userType] ?? 'Person'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {canRemove && member.id !== user?.id && (
                      <button className='btn ghost s' onClick={() => setRemoving(member)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className='faint sm' style={{ textAlign: 'center', padding: 24 }}>
                    {isMembersLoading ? 'Loading…' : 'No members yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canManage && (
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
                    {roleTitle(invitation.userRoleType?.name)}
                    {invitation.expiresAt ? ` · expires ${formatDate(invitation.expiresAt)}` : ''}
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
                    Copy link
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className='card-b faint sm'>No pending invitations.</div>
          )}
        </div>
      )}

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        agentName={agentName}
        organizationName={organizationName}
        roles={grantableRoles(myRole)}
        canInvite={canInvite}
        onInvite={invite}
      />

      <AddMembersDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        people={others}
        organizationName={organizationName}
        onAdd={addMembers}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.name || removing?.email || ''}?`}
        text={`They will lose access to ${agentName}. They stay a member of ${organizationName}.`}
        confirmLabel='Remove'
        onConfirm={() => remove(removing)}
      />
    </main>
  )
}

AgentMembersPage.getLayout = page => (
  <AppLayout page='agents' title='Members' crumb='Agents'>
    {page}
  </AppLayout>
)

AgentMembersPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default AgentMembersPage
