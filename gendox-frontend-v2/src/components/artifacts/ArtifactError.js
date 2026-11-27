import { CircleAlert, Wrench } from 'lucide-react'

/**
 * An error the artifact raised and did not handle (gendox-core#523). Try to fix puts a request in the chat's composer,
 * for the user to send; without onFix — an older version, or no composer at hand — the error is only shown.
 * The message is the artifact's own text, shown as text.
 */
const ArtifactError = ({ error, onFix, hint }) => (
  <div className='alert art-err' style={{ '--c': 'var(--warn)' }}>
    <b>
      <CircleAlert className='lucide' />
      The artifact hit an error
    </b>
    <div className='mono sm' style={{ overflowWrap: 'anywhere' }}>
      {error.message}
      {error.line ? ` (line ${error.line})` : ''}
    </div>
    {onFix ? (
      <div className='row' style={{ marginTop: 6 }}>
        <button className='btn s' onClick={onFix}>
          <Wrench className='lucide' />
          Try to fix
        </button>
      </div>
    ) : (
      hint && <div className='faint sm' style={{ marginTop: 4 }}>{hint}</div>
    )}
  </div>
)

export default ArtifactError
