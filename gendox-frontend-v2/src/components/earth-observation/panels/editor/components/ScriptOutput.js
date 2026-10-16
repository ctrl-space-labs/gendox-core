import { useSelector } from 'react-redux'
import { ChevronRight, Terminal } from 'lucide-react'

/** What the last run printed (print()), or why it failed. The assistant reads the same output. */
export default function ScriptOutput() {
  const printMessages = useSelector(state => state.earthObservation.map.printMessages)
  const runError = useSelector(state => state.earthObservation.map.geeRunError)

  if (!printMessages?.length && !runError) return null

  return (
    <details className='eo-out' open>
      <summary>
        <ChevronRight className='lucide' style={{ width: 14 }} />
        <Terminal className='lucide' style={{ width: 14 }} />
        Output
        <span className='sp' />
        <span className='faint sm hide-sm'>The assistant sees this</span>
      </summary>
      <pre>
        {printMessages.map((line, i) => (
          <span key={i}>
            {typeof line === 'string' ? line : JSON.stringify(line)}
            {'\n'}
          </span>
        ))}
        {runError && <span className='err'>{String(runError)}</span>}
      </pre>
    </details>
  )
}
