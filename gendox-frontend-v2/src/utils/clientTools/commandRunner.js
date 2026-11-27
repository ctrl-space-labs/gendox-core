// Runs `run_command` tool calls on this computer, following the user's approval mode.
// Plain JavaScript with no React or Redux, so the desktop tests can import it directly
// (the `.js` extension below is for those Node tests; the app resolves it either way).
import { approvalDecision } from './preferences.js'

const failure = message => ({ exit_code: -1, stdout: '', stderr: message, duration_ms: 0 })

/** The longest `timeout_seconds` a call may ask for; without one, the app allows 10 minutes. */
export const MAX_TIMEOUT_SECONDS = 2 * 60 * 60

/** The answer to a call that waited while the app was closed: it is never started afterwards. */
export const APP_CLOSED = Object.freeze({
  app_closed: true,
  message: 'The Gendox desktop app was closed while this command waited, so it did not run or stopped partway. It was not started again.'
})

const isValidCall = args =>
  args &&
  !Array.isArray(args) &&
  typeof args.command === 'string' &&
  args.command.trim() &&
  typeof args.description === 'string' &&
  args.description.trim() &&
  (args.cwd === undefined || typeof args.cwd === 'string') &&
  (args.timeout_seconds === undefined ||
    (Number.isInteger(args.timeout_seconds) && args.timeout_seconds > 0 && args.timeout_seconds <= MAX_TIMEOUT_SECONDS))

/**
 * @param native      the desktop operations: commandStatus, runCommand, chooseFolder, stop
 * @param preferences returns the current preferences ({ mode: 'ask' | 'auto' | 'plan' })
 * @param approve     asks the user; resolves to true or false
 * @param changed     told when a command starts or stops, or the allowed folders change
 */
export function createCommandRunner({ native, preferences, approve, changed, isCurrent = () => true }) {
  let running = false

  async function runOnce(request, executionId, call) {
    running = true
    changed({ running: true, call, executionId, command: request.command })
    try {
      return await native.runCommand(request, executionId)
    } catch (error) {
      return failure(String(error?.message || error))
    } finally {
      running = false
      changed({ running: false, call, executionId })
    }
  }

  async function execute(args, executionId, call) {
    if (!isValidCall(args)) {
      return failure(
        `The tool needs command and description strings, an optional working folder and an optional timeout_seconds from 1 to ${MAX_TIMEOUT_SECONDS}.`
      )
    }
    const request = { command: args.command, description: args.description }
    if (args.cwd) request.cwd = args.cwd
    if (args.timeout_seconds) request.timeout_seconds = args.timeout_seconds

    // A call that already ran (before a reload, for example) returns its result again.
    const previous = await native.commandStatus?.(request, executionId, Boolean(call?.replayed))
    if (previous?.result) return previous.result
    if (previous?.closed) return APP_CLOSED

    const decision = approvalDecision(preferences().mode)
    if (decision === 'decline' || !isCurrent(call)) return { declined: true }
    if (!previous?.known && (decision === 'ask' || call?.requiresApproval)) {
      const allowed = await approve({ executionId, args, call })
      if (!allowed) return { declined: true }
    }

    // Plan may have been chosen while the user was deciding.
    if (preferences().mode === 'plan' || !isCurrent(call)) return { declined: true }
    const result = await runOnce(request, executionId, call)
    // Only the native preflight can identify a specific folder. Shell errors may be about reads or another path.
    if (!result?.permission_required || !result.directory || !isCurrent(call)) return result

    const folders = await native.chooseFolder(result.directory)
    changed({ folders })
    if (!folders?.chosen || preferences().mode === 'plan' || !isCurrent(call)) return { declined: true }

    return runOnce(request, `${executionId}:retry:1`, call)
  }

  async function stop() {
    if (running) await native.stop()
  }

  return { execute, stop }
}
