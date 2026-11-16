import { useState } from 'react'
import { CircleAlert, LoaderCircle, Maximize2, RefreshCw } from 'lucide-react'
import ArtifactContent from 'src/components/artifacts/ArtifactContent'
import ArtifactError from 'src/components/artifacts/ArtifactError'
import { CREATE_ARTIFACT, fixRequestOf, kindInfo } from 'src/components/artifacts/artifactUtils'

// a tool error in plain words; the code stays small, for support
const errorText = error =>
  error.code === 'TOOL_CALL_CUT_SHORT'
    ? 'The artifact was too long to write in one go. The agent was asked to make it smaller, or to build it in steps.'
    : error.message || 'The agent couldn’t save the artifact.'

/**
 * An artifact where the agent made or changed it (gendox-core#523). Everything shown comes from the tool call and its
 * result, already in the thread: no request per card. A new artifact shows a preview of what was written; a change
 * shows one line, and loads nothing until it is opened.
 *
 * @param call - from artifactCallOf
 * @param onOpen({ artifactId, version }) - open it in the panel or a tab; without it there is no Open button
 * @param latestVersion - the artifact's latest version the conversation knows of; Try to fix is offered only on it
 * @param onAsk(text) - put a request in the chat's composer; without it an error is only shown
 */
const ArtifactCard = ({ call, onOpen, latestVersion, onAsk }) => {
  const { name, args, result, error, pending } = call
  const [raised, setRaised] = useState(null) // the preview's first unhandled error

  if (error) {
    return (
      <div className='alert' style={{ '--c': 'var(--warn)' }}>
        <b>
          <CircleAlert className='lucide' />
          {name === CREATE_ARTIFACT ? 'Artifact not created' : 'Artifact not changed'}
        </b>
        <span className='muted'>{errorText(error)}</span>
        <div className='faint sm mono' style={{ marginTop: 6 }}>
          {error.code}
        </div>
      </div>
    )
  }

  const created = name === CREATE_ARTIFACT
  const kind = String(result?.kind || args.kind || '').toLowerCase()
  const { label, icon: Icon } = kindInfo(kind)
  const title = result?.title || args.title || 'Artifact'
  const open = result && onOpen ? () => onOpen({ artifactId: result.artifactId, version: result.version }) : null

  return (
    <div className='gc-art'>
      <div className='gc-art-h'>
        {created ? <Icon className='lucide' /> : <RefreshCw className='lucide' />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <b className='trunc' style={{ display: 'block' }}>
            {title}
          </b>
          <span className='faint sm'>
            {pending
              ? created
                ? 'Saving…'
                : 'Saving the change…'
              : created
                ? `${label} · v${result.version}`
                : `Updated · v${result.version}`}
          </span>
        </div>
        {pending && <LoaderCircle className='lucide turning' />}
        {open && (
          <button className='btn s' onClick={open}>
            <Maximize2 className='lucide' />
            Open
          </button>
        )}
      </div>
      {created && typeof args.content === 'string' && (
        <div className={`gc-art-b ${kind === 'html' || kind === 'svg' ? '' : 'clip'}`}>
          <ArtifactContent
            kind={kind}
            content={args.content}
            codeLanguage={args.code_language}
            title={title}
            fit
            onError={setRaised}
          />
        </div>
      )}
      {raised && (
        <ArtifactError
          error={raised}
          onFix={onAsk && result && result.version === latestVersion ? () => onAsk(fixRequestOf(title, raised)) : null}
          hint={result && result.version !== latestVersion ? 'A later version changed it.' : null}
        />
      )}
    </div>
  )
}

export default ArtifactCard
