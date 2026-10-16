/**
 * An on/off switch.
 * @param checked - whether it is on
 * @param onChange - (next) => …
 */
const Switch = ({ checked, onChange, disabled = false, label }) => {
  return (
    <button
      type='button'
      role='switch'
      aria-checked={Boolean(checked)}
      aria-label={label}
      className={`switch ${checked ? 'on' : ''}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  )
}

export default Switch
