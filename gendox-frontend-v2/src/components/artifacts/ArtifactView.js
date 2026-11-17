import { useEffect, useState } from 'react'
import { Check, CircleAlert, Copy, Download, MessageSquarePlus, Share2, ShieldCheck } from 'lucide-react'
import artifactService from 'src/gendox-sdk/artifactService'
import { copyToClipboard } from 'src/utils/copyToClipboard'
import Spinner from 'src/components/ui/Spinner'
import Markdown from 'src/components/chat/Markdown'
import ArtifactContent from 'src/components/artifacts/ArtifactContent'
import ArtifactError from 'src/components/artifacts/ArtifactError'
import ArtifactShareDialog from 'src/components/artifacts/ArtifactShareDialog'
import useActiveScope from 'src/hooks/useActiveScope'
import { downloadFile, fencedCode, fileNameOf, fixRequestOf, kindInfo, kindOf, sourceLanguageOf } from 'src/components/artifacts/artifactUtils'

/**
 * One artifact in full (gendox-core#523): Preview and Code, its versions, copy, download, Share, Ask for a change, and
 * Try to fix when the latest version raises an error. It is opened from the user's own conversations, so it can be
 * shared; inside an organization only.
 * Loads when it opens; the latest version unless one is asked for. When the chat makes a newer version it moves to
 * it, unless the user chose an older one.
 *
 * @param knownVersion - the latest version the conversation knows of; a higher one reloads
 * @param version - the version to open with (from a card), the latest when absent
 * @param agentName - who made it, for the footer
 * @param onAsk(text) - put a request in the chat's composer; without it there is no Ask for a change or Try to fix
 * @param onTitle(title) - the artifact's title once loaded, for a header or a tab
 */
const ArtifactView = ({ threadId, artifactId, token, version: openedVersion, knownVersion, agentName, onAsk, onTitle }) => {
  const [artifact, setArtifact] = useState(null)
  const [failed, setFailed] = useState(false)
  const [tab, setTab] = useState('preview')
  const [chosen, setChosen] = useState(openedVersion ?? null) // null: follow the latest
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null) // the shown version's first unhandled error
  const [sharing, setSharing] = useState(false)
  const { organizationId } = useActiveScope()
  // following the latest, a newer version from the chat loads it; a chosen older one stays
  const followed = chosen === null ? knownVersion : null

  useEffect(() => {
    setChosen(openedVersion ?? null)
  }, [artifactId, openedVersion])

  useEffect(() => {
    if (!threadId || !artifactId) return
    let current = true
    setFailed(false)
    const request =
      chosen === null
        ? artifactService.getArtifact(threadId, artifactId, token)
        : artifactService.getArtifactVersion(threadId, artifactId, chosen, token)
    request
      .then(response => {
        if (!current) return
        setArtifact(response.data)
        onTitle?.(response.data.title)
      })
      .catch(() => current && setFailed(true))

    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, artifactId, chosen, followed, token])

  if (failed) {
    return (
      <div className='alert' style={{ '--c': 'var(--warn)' }}>
        <b>
          <CircleAlert className='lucide' />
          The artifact couldn’t be loaded
        </b>
        <span className='muted'>It may belong to a conversation you can’t open. Try again in a moment.</span>
      </div>
    )
  }
  if (!artifact) return <Spinner />

  const kind = kindOf(artifact)
  const name = fileNameOf(artifact.title, kind, artifact.codeLanguage)
  const isLatest = artifact.version === artifact.latestVersion

  const handleCopy = () => {
    copyToClipboard(artifact.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='art-view'>
      <div className='art-bar'>
        <div className='seg' role='tablist'>
          {[
            ['preview', 'Preview'],
            ['code', 'Code']
          ].map(([id, label]) => (
            <button
              key={id}
              role='tab'
              aria-selected={tab === id}
              className={tab === id ? 'on' : ''}
              style={{ width: 'auto', padding: '0 10px' }}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          className='input s'
          style={{ width: 'auto', paddingRight: 30 }}
          aria-label='Version'
          value={artifact.version}
          onChange={e => {
            const next = Number(e.target.value)
            setChosen(next === artifact.latestVersion ? null : next)
          }}
        >
          {[...(artifact.versions || [])].reverse().map(v => (
            <option key={v.version} value={v.version}>
              v{v.version}
              {v.version === artifact.latestVersion ? ' · latest' : ''}
            </option>
          ))}
        </select>
        <span className='sp' />
        <button className='btn ghost s icon' title='Copy' onClick={handleCopy}>
          {copied ? <Check className='lucide' /> : <Copy className='lucide' />}
        </button>
        <button
          className='btn ghost s icon'
          title={`Download ${name}`}
          onClick={() => downloadFile(name, kindInfo(kind).mime, artifact.content)}
        >
          <Download className='lucide' />
        </button>
        {organizationId && (
          <button className='btn s' onClick={() => setSharing(true)}>
            <Share2 className='lucide' />
            Share
          </button>
        )}
        {onAsk && (
          <button className='btn s' onClick={() => onAsk(`Change “${artifact.title}”: `)}>
            <MessageSquarePlus className='lucide' />
            Ask for a change
          </button>
        )}
      </div>
      {error && (
        <ArtifactError
          error={error}
          onFix={onAsk && isLatest ? () => onAsk(fixRequestOf(artifact.title, error)) : null}
          hint={isLatest ? 'Ask for a fix in its conversation.' : 'This is an older version; the latest may not have it.'}
        />
      )}
      {!isLatest && (
        <div className='faint sm'>
          Showing v{artifact.version} of {artifact.latestVersion}.{' '}
          <button className='linkbtn' onClick={() => setChosen(null)}>
            Show the latest
          </button>
        </div>
      )}
      <div className='art-b'>
        {tab === 'preview' ? (
          <ArtifactContent
            kind={kind}
            content={artifact.content}
            codeLanguage={artifact.codeLanguage}
            title={artifact.title}
            onError={setError}
          />
        ) : (
          <Markdown text={fencedCode(artifact.content, sourceLanguageOf(kind, artifact.codeLanguage))} />
        )}
      </div>
      <div className='art-note faint sm'>
        <ShieldCheck className='lucide' />
        <span>
          Made by {agentName || 'the agent'}. It runs sealed: it can’t reach your account, other pages or the internet.
        </span>
      </div>
      {organizationId && (
        <ArtifactShareDialog
          open={sharing}
          onClose={() => setSharing(false)}
          threadId={threadId}
          artifactId={artifactId}
          title={artifact.title}
          version={artifact.version}
          latestVersion={artifact.latestVersion}
          organizationId={organizationId}
          agentName={agentName}
        />
      )}
    </div>
  )
}

export default ArtifactView
