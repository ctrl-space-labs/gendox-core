import { ShieldCheck } from 'lucide-react'

// One approval presentation for client tools; backend approval events can use the same component.
export default function ToolApprovalCard({
  title = 'Allow this action?',
  description,
  command,
  directory,
  retry = false,
  allowLabel = 'Allow',
  onAllow,
  onDecline,
  busy = false,
  error
}) {
  return (
    <section className='client-approval card card-b' aria-label={title}>
      <h3>
        <ShieldCheck className='lucide' /> {title}
      </h3>
      <p className='muted'>{description}</p>
      {command && <pre className='client-command'>{command}</pre>}
      {directory && (
        <p className='sm'>
          Requested folder: <code>{directory}</code>
        </p>
      )}
      {retry && (
        <p className='muted sm'>The first attempt may have completed some work. Retrying can repeat those changes.</p>
      )}
      {error && <p role='alert'>{error}</p>}
      <div className='row'>
        <button className='btn' disabled={busy} onClick={onDecline}>
          Don’t allow
        </button>
        <button className='btn primary' disabled={busy} aria-busy={busy} onClick={onAllow}>
          {allowLabel}
        </button>
      </div>
    </section>
  )
}
