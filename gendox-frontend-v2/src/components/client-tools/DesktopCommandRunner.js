import { useEffect } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import desktopBridge, { isDesktopApp } from 'src/services/desktopBridge'
import { createCommandRunner } from 'src/utils/clientTools/commandRunner'
import {
  commandFinished,
  commandOutput,
  commandRunningChanged,
  commandStarted,
  foldersChanged
} from 'src/store/clientDevice/clientDevice'
import { useToolApprovals } from 'src/components/client-tools/ToolApprovalsProvider'

// In the desktop app, answers the agent's `run_command` tool calls. Renders nothing.
const DesktopCommandRunner = () => {
  const dispatch = useDispatch()
  const store = useStore()
  const ready = useSelector(state => state.clientDevice.ready)
  const approvals = useToolApprovals()

  useEffect(() => {
    if (!ready || !approvals || !isDesktopApp()) return
    const host = window.__GENDOX_CLIENT_TOOL_HOST__

    const runner = createCommandRunner({
      native: {
        commandStatus: desktopBridge.commandStatus,
        runCommand: desktopBridge.runCommand,
        chooseFolder: desktopBridge.chooseFolder,
        stop: desktopBridge.stopCommand
      },
      preferences: () => store.getState().clientDevice.preferences,
      approve: approvals.requestApproval,
      changed: change => {
        if (change.folders) dispatch(foldersChanged(change.folders))
        if (change.running === true) {
          dispatch(
            commandStarted({
              executionId: change.executionId,
              threadId: change.call?.threadId,
              command: change.command,
              startedAt: Date.now()
            })
          )
        }
        if (change.running === false) dispatch(commandFinished(change.executionId))
        if (change.running !== undefined) {
          dispatch(commandRunningChanged(change.running))
          desktopBridge
            .setActivity(change.running)
            .catch(error => console.error('Failed to show command activity', error))
        }
      }
    })
    host.registerTool('run_command', runner.execute)

    // The output of a running command, as the app reads it
    const stopListening = desktopBridge.onNativeEvent(event => {
      if (event.type === 'command-output') dispatch(commandOutput(event))
    })

    // Once this component is gone, a late call is declined rather than left waiting.
    return () => {
      stopListening()
      host.registerTool('run_command', async () => ({ declined: true }))
    }
  }, [ready, approvals, dispatch, store])

  return null
}

export default DesktopCommandRunner
