import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Lock, Users } from 'lucide-react'
import artifactService from 'src/gendox-sdk/artifactService'
import projectService from 'src/gendox-sdk/projectService'
import { getToken } from 'src/components/agent/useAgent'
import { useAuth } from 'src/authentication/useAuth'
import { getErrorMessage } from 'src/utils/errorHandler'
import Dialog from 'src/components/ui/Dialog'
import Avatar from 'src/components/ui/Avatar'
import Spinner from 'src/components/ui/Spinner'
import { ROLES, SHARED_ROLES } from 'src/components/artifacts/artifactUtils'

const nameOf = user =>
  user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.userName || user?.email || 'Someone'

/** A role to choose: Viewer, Contributor or Editor, and, for an invited person, Remove */
const RoleSelect = ({ value, onChange, disabled, removable, label }) => (
  <select
    className='input s'
    style={{ width: 'auto', paddingRight: 30 }}
    aria-label={label}
    value={value}
    disabled={disabled}
    onChange={e => onChange(e.target.value)}
  >
    {SHARED_ROLES.map(role => (
      <option key={role} value={role}>
        {ROLES[role].label}
      </option>
    ))}
    {removable && <option value='REMOVE'>Remove access</option>}
  </select>
)

/** One person with access: avatar, name and email, and their role, or the control that changes it */
const PersonRow = ({ person, you, children }) => (
  <div className='art-share-row'>
    <Avatar name={person.name || person.email} seed={person.userId} round />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className='trunc' style={{ fontWeight: 500 }}>
        {person.name || person.email || 'Someone'}
        {you && <span className='faint'> (you)</span>}
      </div>
      {person.email && <div className='faint sm trunc'>{person.email}</div>}
    </div>
    {children ?? <span className='badge'>{ROLES[person.role]?.label ?? person.role}</span>}
  </div>
)

/**
 * Who has a role on an artifact (gendox-core#570), as Claude's artifacts share: its owner; every member of the agent,
 * with one role, or none; and members of the agent invited by name, each with a role. A Viewer sees it, a Contributor
 * also uses it, an Editor also changes it with the agent in a chat of their own. Nobody sees the conversation it was
 * made in. Anyone with a role sees who has access; only the owner changes it.
 *
 * @param agentName - the agent whose members it can be shared with
 */
const ArtifactShareDialog = ({ open, onClose, artifactId, title, organizationId, projectId, agentName }) => {
  const { user } = useAuth()
  const [sharing, setSharing] = useState(null) // null while it loads
  const [failed, setFailed] = useState(false)
  const [members, setMembers] = useState([]) // the agent's members, who can be invited
  const [busy, setBusy] = useState(null) // what is being saved: 'general', 'add', or a user id
  const [person, setPerson] = useState('')
  const [personRole, setPersonRole] = useState('VIEW')

  const isOwner = sharing?.yourRole === 'OWNER'

  useEffect(() => {
    if (!open) return
    let current = true
    setSharing(null)
    setFailed(false)
    setPerson('')
    setPersonRole('VIEW')
    artifactService
      .getSharing(artifactId, getToken())
      .then(response => current && setSharing(response.data))
      .catch(() => current && setFailed(true))

    return () => {
      current = false
    }
  }, [open, artifactId])

  // the people to invite are the agent's members: asked once the user turns out to be the owner
  useEffect(() => {
    if (!open || !isOwner || !organizationId || !projectId) return
    let current = true
    projectService
      .getProjectMembers(organizationId, projectId, getToken())
      .then(response => current && setMembers(response.data ?? []))
      .catch(() => current && setMembers([]))

    return () => {
      current = false
    }
  }, [open, isOwner, organizationId, projectId])

  // members of the agent who can still be invited: people, not agents, not the owner, not already invited
  const candidates = useMemo(() => {
    if (!sharing) return []
    const taken = new Set([sharing.owner?.userId, ...(sharing.members ?? []).map(m => m.userId)])

    return members
      .map(m => m.user)
      .filter(u => u?.id && u.userType?.name !== 'GENDOX_AGENT' && !taken.has(u.id))
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  }, [members, sharing])

  // every change answers with the whole sharing, which replaces the one on screen
  const save = async (key, request) => {
    setBusy(key)
    try {
      setSharing((await request()).data)

      return true
    } catch (error) {
      toast.error(getErrorMessage(error))

      return false
    } finally {
      setBusy(null)
    }
  }

  const setGeneralAccess = role =>
    save('general', () => artifactService.setGeneralAccess(artifactId, role || null, getToken()))

  const setRole = (userId, role) =>
    save(userId, () =>
      role === 'REMOVE'
        ? artifactService.removeMember(artifactId, userId, getToken())
        : artifactService.setMemberRole(artifactId, userId, role, getToken())
    )

  const invite = async () => {
    if (await save('add', () => artifactService.setMemberRole(artifactId, person, personRole, getToken()))) {
      setPerson('')
    }
  }

  const agent = agentName || 'this agent'
  const general = sharing?.generalAccessRole ?? ''

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isOwner || !sharing ? `Share “${title}”` : `Who has access to “${title}”`}
      subtitle={
        isOwner || !sharing
          ? 'People you share it with see the artifact, never your conversation.'
          : 'Only its owner can change who has access.'
      }
      footer={
        <button className='btn' onClick={onClose}>
          Done
        </button>
      }
    >
      {failed ? (
        <div className='alert' style={{ '--c': 'var(--warn)' }}>
          <b>Who has access couldn’t be loaded</b>
          <span className='muted'>Try again in a moment.</span>
        </div>
      ) : sharing === null ? (
        <Spinner />
      ) : (
        <div className='form art-share'>
          {isOwner && (
            <div className='field'>
              <label htmlFor='art-share-person'>Add people from {agent}</label>
              <div className='row' style={{ gap: 8 }}>
                <select
                  id='art-share-person'
                  className='input'
                  style={{ flex: 1, minWidth: 0 }}
                  value={person}
                  onChange={e => setPerson(e.target.value)}
                >
                  <option value=''>{candidates.length ? 'Choose someone' : 'No one else to add'}</option>
                  {candidates.map(u => (
                    <option key={u.id} value={u.id}>
                      {nameOf(u)}
                      {u.email ? ` · ${u.email}` : ''}
                    </option>
                  ))}
                </select>
                <RoleSelect value={personRole} onChange={setPersonRole} label='Their role' />
                <button
                  className='btn primary'
                  disabled={!person || busy === 'add'}
                  aria-busy={busy === 'add'}
                  onClick={invite}
                >
                  Invite
                </button>
              </div>
            </div>
          )}

          <div className='field'>
            <span className='lab'>People with access</span>
            {sharing.owner && <PersonRow person={{ ...sharing.owner, role: 'OWNER' }} you={isOwner} />}
            {(sharing.members ?? []).map(member => (
              <PersonRow key={member.userId} person={member} you={member.userId === user?.id}>
                {isOwner ? (
                  <RoleSelect
                    value={member.role}
                    removable
                    disabled={busy === member.userId}
                    label={`Role of ${member.name || member.email || 'this person'}`}
                    onChange={role => setRole(member.userId, role)}
                  />
                ) : undefined}
              </PersonRow>
            ))}
          </div>

          <div className='field'>
            <span className='lab'>General access</span>
            <div className='art-share-row'>
              <span className='ftype'>{general ? <Users className='lucide' /> : <Lock className='lucide' />}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isOwner ? (
                  <select
                    className='input s'
                    aria-label='Who in the agent has access'
                    value={general ? 'AGENT' : ''}
                    disabled={busy === 'general'}
                    onChange={e => setGeneralAccess(e.target.value ? 'VIEW' : null)}
                  >
                    <option value=''>Only people with access</option>
                    <option value='AGENT'>Everyone in {agent}</option>
                  </select>
                ) : (
                  <div style={{ fontWeight: 500 }}>{general ? `Everyone in ${agent}` : 'Only people with access'}</div>
                )}
                <div className='faint sm'>
                  {general
                    ? `Every member of ${agent}, now and later, ${ROLES[general]?.text ?? 'can view'}.`
                    : 'Only the people above can open it.'}
                </div>
              </div>
              {general &&
                (isOwner ? (
                  <RoleSelect
                    value={general}
                    disabled={busy === 'general'}
                    label={`Role of everyone in ${agent}`}
                    onChange={setGeneralAccess}
                  />
                ) : (
                  <span className='badge'>{ROLES[general]?.label ?? general}</span>
                ))}
            </div>
          </div>

        </div>
      )}
    </Dialog>
  )
}

export default ArtifactShareDialog
