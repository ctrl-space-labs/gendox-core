import { useState } from 'react'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import ArtifactContent from 'src/components/artifacts/ArtifactContent'
import ArtifactError from 'src/components/artifacts/ArtifactError'
import { fixRequestOf } from 'src/components/artifacts/artifactUtils'

// a tool error in plain words; the code stays small, for support
const errorText = error =>
  error.code === 'TOOL_CALL_CUT_SHORT'
    ? 'The widget was too long to write in one go. The agent was asked to make it smaller.'
    : error.message || 'The agent couldn’t show the widget.'

/**
 * A widget: something small and interactive that is part of the answer (gendox-core#570). It is not an artifact:
 * there is nothing to open, share or change, and nothing done inside it is kept. It runs from its show_widget call,
 * already in the thread, in the same sealed frame as an artifact, sized to its content; no request. Only once the
 * server's result says it was shown.
 *
 * @param call - from widgetCallOf
 * @param isLatest - the conversation's latest widget; Try to fix is offered only on it
 * @param onAsk(text) - put a request in the chat's composer; without it an error is only shown
 */
const WidgetCard = ({ call, isLatest, onAsk }) => {
  const { args, shown, error, pending } = call
  const [raised, setRaised] = useState(null) // the widget's first unhandled error
  const title = args.title || 'the widget'

  if (error) {
    return (
      <div className='alert' style={{ '--c': 'var(--warn)' }}>
        <b>
          <CircleAlert className='lucide' />
          Widget not shown
        </b>
        <span className='muted'>{errorText(error)}</span>
        <div className='faint sm mono' style={{ marginTop: 6 }}>
          {error.code}
        </div>
      </div>
    )
  }
  // it runs only once the server accepted the call: the call reaches the chat before the server checked it, and one
  // that is then refused (a public thread, a kind or a length not allowed) must never have run
  if (!shown || typeof args.content !== 'string') return pending ? <LoaderCircle className='lucide turning' /> : null

  return (
    <div className='answer-widget' role='group' aria-label={title}>
      <ArtifactContent
        kind={String(args.kind || '').toLowerCase()}
        content={args.content}
        title={title}
        fit
        minHeight={32}
        onError={setRaised}
      />
      {raised && (
        <ArtifactError
          error={raised}
          onFix={onAsk && isLatest ? () => onAsk(fixRequestOf(args.title, raised, 'the widget')) : null}
          hint={isLatest ? null : 'A later widget replaced it.'}
        />
      )}
    </div>
  )
}

export default WidgetCard
