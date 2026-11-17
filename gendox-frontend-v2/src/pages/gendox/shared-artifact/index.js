import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Check, CircleAlert, Copy, Download, ShieldCheck } from 'lucide-react'
import artifactService from 'src/gendox-sdk/artifactService'
import { getToken } from 'src/components/agent/useAgent'
import { copyToClipboard } from 'src/utils/copyToClipboard'
import { formatDateTime, timeAgo } from 'src/components/knowledge/documentUtils'
import {
  downloadFile,
  fencedCode,
  fileNameOf,
  kindInfo,
  kindOf,
  sourceLanguageOf
} from 'src/components/artifacts/artifactUtils'
import ArtifactContent from 'src/components/artifacts/ArtifactContent'
import ArtifactError from 'src/components/artifacts/ArtifactError'
import Markdown from 'src/components/chat/Markdown'
import AppLayout from 'src/layouts/AppLayout'
import Spinner from 'src/components/ui/Spinner'

/**
 * An artifact someone shared with the user (gendox-core#523), opened from its link or from Shared with you. Read
 * only: Preview and Code, copy and download, who shared it and when. Never the conversation it was made in, nor its
 * other versions; the share decides whether it follows the latest or stays at one.
 */
const SharedArtifactPage = () => {
  const router = useRouter()
  const { shareId } = router.query
  const [shared, setShared] = useState(null)
  const [failed, setFailed] = useState(false)
  const [tab, setTab] = useState('preview')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!shareId) return
    let current = true
    setShared(null)
    setFailed(false)
    artifactService
      .getSharedArtifact(shareId, getToken())
      .then(response => current && setShared(response.data))
      .catch(() => current && setFailed(true))

    return () => {
      current = false
    }
  }, [shareId])

  if (failed || (router.isReady && !shareId)) {
    return (
      <main className='content'>
        <div className='alert' style={{ '--c': 'var(--warn)' }}>
          <b>
            <CircleAlert className='lucide' />
            This artifact can’t be opened
          </b>
          <span className='muted'>
            It may no longer be shared, or not with you. Ask the person who shared it for a new link.
          </span>
        </div>
      </main>
    )
  }
  if (!shared) {
    return (
      <main className='content'>
        <Spinner />
      </main>
    )
  }

  const kind = kindOf(shared)
  const { label, icon: Icon, hue, mime } = kindInfo(kind)
  const name = fileNameOf(shared.title, kind, shared.codeLanguage)
  const by = shared.sharedByName || 'Someone'

  return (
    <main className='content art-shared'>
      <div className='page-h'>
        <div className='row' style={{ gap: 12, minWidth: 0 }}>
          <span className='ftype big' style={{ '--h': hue }}>
            <Icon className='lucide' />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 className='trunc'>{shared.title}</h1>
            <p>
              {label} shared by {by} <span title={formatDateTime(shared.sharedAt)}>{timeAgo(shared.sharedAt)}</span>
              {' · '}
              {shared.followsLatest ? (
                <span title={formatDateTime(shared.updatedAt)}>latest version, changed {timeAgo(shared.updatedAt)}</span>
              ) : (
                `version ${shared.version}`
              )}
            </p>
          </div>
        </div>
      </div>

      <div className='art-view'>
        <div className='art-bar'>
          <div className='seg' role='tablist'>
            {[
              ['preview', 'Preview'],
              ['code', 'Code']
            ].map(([id, text]) => (
              <button
                key={id}
                role='tab'
                aria-selected={tab === id}
                className={tab === id ? 'on' : ''}
                style={{ width: 'auto', padding: '0 10px' }}
                onClick={() => setTab(id)}
              >
                {text}
              </button>
            ))}
          </div>
          <span className='sp' />
          <button
            className='btn ghost s icon'
            title='Copy'
            onClick={() => {
              copyToClipboard(shared.content)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
          >
            {copied ? <Check className='lucide' /> : <Copy className='lucide' />}
          </button>
          <button className='btn ghost s icon' title={`Download ${name}`} onClick={() => downloadFile(name, mime, shared.content)}>
            <Download className='lucide' />
          </button>
        </div>
        {error && <ArtifactError error={error} hint={`Let ${by} know; it can be fixed in their conversation.`} />}
        <div className='art-b'>
          {tab === 'preview' ? (
            <ArtifactContent
              kind={kind}
              content={shared.content}
              codeLanguage={shared.codeLanguage}
              title={shared.title}
              onError={setError}
            />
          ) : (
            <Markdown text={fencedCode(shared.content, sourceLanguageOf(kind, shared.codeLanguage))} />
          )}
        </div>
        <div className='art-note faint sm'>
          <ShieldCheck className='lucide' />
          <span>Made by an AI agent. It runs sealed: it can’t reach your account, other pages or the internet.</span>
        </div>
      </div>
    </main>
  )
}

SharedArtifactPage.getLayout = page => (
  <AppLayout page='artifacts' title='Shared artifact'>
    {page}
  </AppLayout>
)

SharedArtifactPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default SharedArtifactPage
