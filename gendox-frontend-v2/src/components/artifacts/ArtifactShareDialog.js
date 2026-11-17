import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Link2, Users, X } from 'lucide-react'
import artifactService from 'src/gendox-sdk/artifactService'
import { useAuth } from 'src/authentication/useAuth'
import { getToken } from 'src/components/agent/useAgent'
import useOrganizationUsers from 'src/hooks/useOrganizationUsers'
import { copyToClipboard } from 'src/utils/copyToClipboard'
import { getErrorMessage } from 'src/utils/errorHandler'
import Dialog from 'src/components/ui/Dialog'
import Switch from 'src/components/ui/Switch'
import Avatar from 'src/components/ui/Avatar'
import Spinner from 'src/components/ui/Spinner'
import { sharedArtifactLink } from 'src/components/artifacts/artifactUtils'

const nameOf = user =>
  user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.userName || user?.email || 'Someone'

/** The version a share shows: the latest, or the one it was pinned to. */
const VersionBadge = ({ version }) => <span className='badge'>{version ? `v${version}` : 'Latest'}</span>

const CopyLink = ({ link }) => {
  const [copied, setCopied] = useState(false)

  return (
    <button
      className='btn ghost s icon'
      title='Copy the link'
      onClick={() => {
        copyToClipboard(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? <Check className='lucide' /> : <Link2 className='lucide' />}
    </button>
  )
}

/**
 * Share an artifact (gendox-core#523): with everyone in its agent, or with chosen members of the organization. Each
 * share follows the latest version or stays at the one on screen, and has its own link. Only the artifact's owner can
 * open it; a reader sees the artifact, never its conversation.
 *
 * @param version - the version on screen, offered as "This version"
 * @param latestVersion - the artifact's newest version
 * @param organizationId - whose members can be chosen
 */
const ArtifactShareDialog = ({ open, onClose, threadId, artifactId, title, version, latestVersion, organizationId, agentName }) => {
  const { user } = useAuth()
  const members = useOrganizationUsers(organizationId)
  const [shares, setShares] = useState(null) // null while they load
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(null) // what is being saved: 'project', a share id, or 'add'
  const [pinned, setPinned] = useState(false) // new shares stay at the version on screen
  const [person, setPerson] = useState('')

  useEffect(() => {
    if (!open) return
    let current = true
    setShares(null)
    setFailed(false)
    setPerson('')
    setPinned(version !== latestVersion)
    artifactService
      .getArtifactShares(threadId, artifactId, getToken())
      .then(response => current && setShares(response.data ?? []))
      .catch(() => current && setFailed(true))

    return () => {
      current = false
    }
  }, [open, threadId, artifactId, version, latestVersion])

  const projectShare = shares?.find(s => s.audience === 'PROJECT')
  const peopleShares = shares?.filter(s => s.audience === 'USER') ?? []

  // people who can still be added: members of the organization, not agents, not the owner, not already shared with
  const candidates = useMemo(() => {
    const taken = new Set(peopleShares.map(s => s.sharedWithUserId))

    return (members || [])
      .map(m => m.user)
      .filter(u => u?.id && u.email && u.userType?.name !== 'GENDOX_AGENT' && u.id !== user?.id && !taken.has(u.id))
      .sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  }, [members, peopleShares, user?.id])

  const share = async (audience, sharedWithUserId, key) => {
    setBusy(key)
    try {
      const response = await artifactService.shareArtifact(
        threadId,
        artifactId,
        { audience, sharedWithUserId, version: pinned ? version : null },
        getToken()
      )
      const created = response.data
      setShares(list => [
        ...list.filter(s =>
          audience === 'PROJECT' ? s.audience !== 'PROJECT' : s.sharedWithUserId !== created.sharedWithUserId
        ),
        created
      ])

      return true
    } catch (error) {
      toast.error(getErrorMessage(error))

      return false
    } finally {
      setBusy(null)
    }
  }

  const stop = async (shareToStop, key) => {
    setBusy(key)
    try {
      await artifactService.stopSharingArtifact(threadId, artifactId, shareToStop.id, getToken())
      setShares(list => list.filter(s => s.id !== shareToStop.id))
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setBusy(null)
    }
  }

  const link = s => sharedArtifactLink(organizationId, s.id)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Share “${title}”`}
      subtitle='People you share it with see the artifact, not your conversation.'
      footer={
        <button className='btn' onClick={onClose}>
          Done
        </button>
      }
    >
      {failed ? (
        <div className='alert' style={{ '--c': 'var(--warn)' }}>
          <b>Who it is shared with couldn’t be loaded</b>
          <span className='muted'>Try again in a moment.</span>
        </div>
      ) : shares === null ? (
        <Spinner />
      ) : (
        <div className='form art-share'>
          <div className='field'>
            <label htmlFor='art-share-version'>New shares show</label>
            <select
              id='art-share-version'
              className='input'
              value={pinned ? 'this' : 'latest'}
              onChange={e => setPinned(e.target.value === 'this')}
            >
              <option value='latest'>The latest version, as it changes</option>
              <option value='this'>This version (v{version}), as it is now</option>
            </select>
          </div>

          <div className='art-share-row'>
            <span className='ftype'>
              <Users className='lucide' />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500 }}>Everyone in {agentName || 'this agent'}</div>
              <div className='faint sm'>The agent’s members, now and later.</div>
            </div>
            {projectShare && (
              <>
                <VersionBadge version={projectShare.version} />
                <CopyLink link={link(projectShare)} />
              </>
            )}
            <Switch
              label={`Share with everyone in ${agentName || 'this agent'}`}
              checked={Boolean(projectShare)}
              busy={busy === 'project'}
              onChange={on => (on ? share('PROJECT', null, 'project') : stop(projectShare, 'project'))}
            />
          </div>

          <div className='field'>
            <label htmlFor='art-share-person'>People in the organization</label>
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
                    {nameOf(u)} · {u.email}
                  </option>
                ))}
              </select>
              <button
                className='btn primary'
                disabled={!person || busy === 'add'}
                aria-busy={busy === 'add'}
                onClick={async () => (await share('USER', person, 'add')) && setPerson('')}
              >
                Share
              </button>
            </div>
            <span className='help'>They can see it whether or not they are members of the agent.</span>
          </div>

          {peopleShares.map(s => (
            <div key={s.id} className='art-share-row'>
              <Avatar name={s.sharedWithName || s.sharedWithEmail} seed={s.sharedWithUserId} round />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className='trunc' style={{ fontWeight: 500 }}>
                  {s.sharedWithName || s.sharedWithEmail || 'Someone'}
                </div>
                {s.sharedWithEmail && <div className='faint sm trunc'>{s.sharedWithEmail}</div>}
              </div>
              <VersionBadge version={s.version} />
              <CopyLink link={link(s)} />
              <button
                className='btn ghost s icon'
                title='Stop sharing with them'
                disabled={busy === s.id}
                onClick={() => stop(s, s.id)}
              >
                <X className='lucide' />
              </button>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  )
}

export default ArtifactShareDialog
