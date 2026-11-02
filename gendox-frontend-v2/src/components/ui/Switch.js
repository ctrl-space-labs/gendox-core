/**
 * An on/off switch.
 * @param checked - whether it is on
 * @param onChange - (next) => …
 * @param busy - its change is being saved: it shows the new position, faded, and can't be clicked
 */
const Switch = ({ checked, onChange, disabled = false, busy = false, label }) => {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={Boolean(checked)}
      aria-label={label}
      aria-busy={busy || undefined}
      className={`switch ${checked ? 'on' : ''}`}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
    />
  )
}

export default Switch
