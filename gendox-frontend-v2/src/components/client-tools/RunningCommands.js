import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { SquareTerminal } from 'lucide-react'
import toast from 'react-hot-toast'
import desktopBridge from 'src/services/desktopBridge'
import { getErrorMessage } from 'src/utils/errorHandler'

const elapsed = milliseconds => {
  const seconds = Math.floor(milliseconds / 1000)

  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`
}

/** One command running on this computer: its output as it arrives, how long it has run, and Stop. */
const RunningCommand = ({ command }) => {
  const [now, setNow] = useState(Date.now())
  const [stopping, setStopping] = useState(false)
  const outputRef = useRef(null)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)

    return () => clearInterval(timer)
  }, [])

  // Follow the end of the output, as a terminal does
  useEffect(() => {
    const output = outputRef.current
    if (output) output.scrollTop = output.scrollHeight
  }, [command.output])

  const stop = async () => {
    setStopping(true)
    try {
      await desktopBridge.stopCommand()
    } catch (error) {
      toast.error(getErrorMessage(error))
      console.error('Failed to stop the command', error)
      setStopping(false)
    }
  }

  return (
    <section className='client-approval card card-b' aria-label='Command running on this computer'>
      <h3>
        <SquareTerminal className='lucide' /> Running on this computer · {elapsed(now - command.startedAt)}
      </h3>
      <pre className='client-command'>{command.command}</pre>
      {command.output && (
        <pre className='client-command client-output' ref={outputRef} aria-live='off'>
          {command.output}
        </pre>
      )}
      <div className='row'>
        <button className='btn' disabled={stopping} aria-busy={stopping} onClick={stop}>
          {stopping ? 'Stopping…' : 'Stop'}
        </button>
      </div>
    </section>
  )
}

/** The commands running for one chat thread, shown under its messages. */
const RunningCommands = ({ threadId }) => {
  const commands = useSelector(state => state.clientDevice.commands)

  return commands
    .filter(command => command.threadId === threadId)
    .map(command => <RunningCommand key={command.executionId} command={command} />)
}

export default RunningCommands
