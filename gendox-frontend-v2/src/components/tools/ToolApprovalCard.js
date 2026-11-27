import { Fragment } from 'react'
import { ShieldCheck, SquareTerminal } from 'lucide-react'
import ToolCodeBlock from 'src/components/tools/ToolCodeBlock'

/**
 * One approval presentation for client tools; backend approval events can use the same component.
 * `fields`: what a tool will do, as [{ label, value }] rows. `terminal`: { command, cwd } of a command
 * on this computer, drawn as a terminal.
 */
export default function ToolApprovalCard({
  title = 'Allow this action?',
  description,
  fields,
  terminal,
  allowLabel = 'Allow',
  onAllow,
  onDecline,
  busy = false,
  error
}) {
  const Icon = terminal ? SquareTerminal : ShieldCheck

  return (
    <section className='client-approval card' aria-label={title}>
      <h3>
        <Icon className='lucide' aria-hidden='true' /> {title}
      </h3>
      {description && <p className='muted'>{description}</p>}
      {fields?.length > 0 && (
        <dl className='client-fields'>
          {fields.map(({ label, value }, index) => (
            <Fragment key={index}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </dl>
      )}
      {terminal?.command && (
        <ToolCodeBlock directory={terminal.cwd} aria-label='Command'>
          {terminal.command}
        </ToolCodeBlock>
      )}
      {error && <p role='alert'>{error}</p>}
      <div className='row'>
        <button className='btn s' disabled={busy} onClick={onDecline}>
          Don’t allow
        </button>
        <button className='btn s primary' disabled={busy} aria-busy={busy} onClick={onAllow}>
          {allowLabel}
        </button>
      </div>
    </section>
  )
}
