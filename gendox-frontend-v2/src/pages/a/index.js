import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Bot, Check, CircleAlert, Copy, Download, ShieldCheck } from 'lucide-react'
import artifactService from 'src/gendox-sdk/artifactService'
import { copyToClipboard } from 'src/utils/copyToClipboard'
import { routeTypes } from 'src/authentication/components/RouteHandler'
import ArtifactContent from 'src/components/artifacts/ArtifactContent'
import Spinner from 'src/components/ui/Spinner'
import { downloadFile, fileNameOf, kindInfo, kindOf } from 'src/components/artifacts/artifactUtils'

/**
 * An artifact anyone can open with its public link, signed in or not (gendox-core#570): /a/?id={publicId}, always at
 * its latest version. Outside the app: no menu, no account, no organization. The artifact runs in the same
 * sealed frame; the page says plainly that an AI agent made it, and never shows its conversation, its other versions
 * or who made it. Not indexed by search engines.
 */
const PublicArtifactPage = () => {
  const router = useRouter()
  const { id } = router.query
  const [artifact, setArtifact] = useState(null)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    if (!id) return setFailed(true)
    let current = true
    setArtifact(null)
    setFailed(false)
    artifactService
      .getPublicArtifact(id)
      .then(response => current && setArtifact(response.data))
      .catch(() => current && setFailed(true))

    return () => {
      current = false
    }
  }, [router.isReady, id])

  const kind = artifact ? kindOf(artifact) : ''
  const name = artifact ? fileNameOf(artifact.title, kind, artifact.codeLanguage) : ''

  return (
    <>
      <Head>
        <title>{artifact ? `${artifact.title} · Gendox` : 'Gendox'}</title>
        <meta name='robots' content='noindex, nofollow' />
      </Head>
      <main className='pub-art'>
        {failed ? (
          <div className='alert' style={{ '--c': 'var(--warn)' }}>
            <b>
              <CircleAlert className='lucide' />
              This link doesn’t open an artifact
            </b>
            <span className='muted'>It may have been made private. Ask the person who sent it for a new link.</span>
          </div>
        ) : !artifact ? (
          <Spinner />
        ) : (
          <>
            <div className='pub-art-h'>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 className='trunc'>{artifact.title}</h1>
                <div className='faint sm'>
                  {kindInfo(kind).label}
                </div>
              </div>
              <button
                className='btn ghost s icon'
                title='Copy'
                onClick={() => {
                  copyToClipboard(artifact.content)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              >
                {copied ? <Check className='lucide' /> : <Copy className='lucide' />}
              </button>
              <button
                className='btn ghost s icon'
                title={`Download ${name}`}
                onClick={() => downloadFile(name, kindInfo(kind).mime, artifact.content)}
              >
                <Download className='lucide' />
              </button>
            </div>
            <div className='art-b'>
              <ArtifactContent kind={kind} content={artifact.content} codeLanguage={artifact.codeLanguage} title={artifact.title} />
            </div>
            <div className='art-note faint sm'>
              <Bot className='lucide' />
              <span>
                Made by the AI agent {artifact.agentName || 'of a Gendox organization'} on Gendox, not by Gendox or the
                organization. An AI can make mistakes.
              </span>
            </div>
            <div className='art-note faint sm'>
              <ShieldCheck className='lucide' />
              <span>It runs sealed: it can’t reach your account, other pages or the internet.</span>
            </div>
          </>
        )}
      </main>
    </>
  )
}

PublicArtifactPage.pageConfig = {
  routeType: routeTypes.sharedRoute
}

export default PublicArtifactPage
