import { Fragment } from 'react'
import ToolCodeBlock from 'src/components/tools/ToolCodeBlock'

export const parseToolValue = value => {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const Fields = ({ value, depth = 0 }) => {
  if (depth >= 4 || value == null || typeof value !== 'object') {
    return typeof value === 'string' ? value || 'Empty' : JSON.stringify(value, null, 2)
  }
  const fields = Object.entries(value)
  if (!fields.length) return 'Empty'

  return (
    <dl className='kv'>
      {fields.map(([key, field]) => (
        <Fragment key={key}>
          <dt>{key}</dt>
          <dd>
            <Fields value={field} depth={depth + 1} />
          </dd>
        </Fragment>
      ))}
    </dl>
  )
}

const Payload = ({ label, value }) => (
  <div>
    <strong className='muted sm'>{label}</strong>
    <div className='client-command gc-tool-fields' tabIndex={0} role='group' aria-label={label}>
      <Fields value={value} />
    </div>
  </div>
)

const CommandResult = ({ value }) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return <Payload label='Result' value={value} />

  const {
    stdout,
    stderr,
    exit_code: exitCode,
    duration_ms: duration,
    declined,
    app_closed,
    permission_required,
    ...details
  } = value
  let status
  if (declined === true) status = 'Declined'
  else if (app_closed === true) status = 'App closed'
  else if (permission_required === true) status = 'Permission required'
  else if (Number.isInteger(exitCode)) status = `Exit ${exitCode}${stdout || stderr ? '' : ' · No output'}`
  const elapsed =
    Number.isFinite(duration) && (duration < 1000 ? `${duration} ms` : `${(duration / 1000).toFixed(1)} s`)
  if (!status && !elapsed && typeof stdout !== 'string' && typeof stderr !== 'string') {
    return <Payload label='Result' value={value} />
  }

  return (
    <>
      {(status || elapsed) && <p className='faint sm'>{[status, elapsed].filter(Boolean).join(' · ')}</p>}
      {[
        ['Output', stdout],
        ['Standard error', stderr]
      ].map(
        ([label, output]) =>
          typeof output === 'string' &&
          output !== '' && (
            <div key={label}>
              <strong className='muted sm'>{label}</strong>
              <ToolCodeBlock output tabIndex={0} aria-label={label}>
                {output}
              </ToolCodeBlock>
            </div>
          )
      )}
      {Object.keys(details).length > 0 && <Payload label='Result details' value={details} />}
    </>
  )
}

export default function ToolCallDetails({ name, input, responses }) {
  const isCommand = name === 'run_command'

  return (
    <>
      {isCommand && typeof input?.command === 'string' && input.command.trim() ? (
        <>
          <ToolCodeBlock tabIndex={0} aria-label='Command'>
            {input.command}
          </ToolCodeBlock>
          {typeof input.cwd === 'string' && input.cwd && (
            <p className='muted sm'>
              Working folder <code>{input.cwd}</code>
            </p>
          )}
          {Number.isFinite(input.timeout_seconds) && <p className='muted sm'>Timeout {input.timeout_seconds} s</p>}
        </>
      ) : (
        input != null && <Payload label='Input' value={input} />
      )}
      {responses.map((response, index) => {
        const value = parseToolValue(response.message)
        const key = response.messageId || index
        if (value?.error === 'CLIENT_TOOL_CANCELLED') {
          return <p className='muted sm' key={key}>Cancelled when you sent a new message.</p>
        }
        if (isCommand) return <CommandResult key={key} value={value} />
        if (name === 'read_skill' && typeof value?.content === 'string') {
          return (
            <p className='muted sm' key={key}>
              The agent read the skill’s instructions.
            </p>
          )
        }

        return <Payload key={key} label='Result' value={value} />
      })}
    </>
  )
}
