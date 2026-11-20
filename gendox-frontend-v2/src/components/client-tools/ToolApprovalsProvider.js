import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { approvalRequested, approvalSettled } from 'src/store/toolApprovals/toolApprovals'
import { answer, answerAll, waitForAnswer } from 'src/utils/clientTools/approvalAnswers'
import { useNotifications } from 'src/components/client-tools/NotificationsProvider'
import ToolApproval from 'src/components/client-tools/ToolApproval'

// Asks the user before a tool call runs. The request goes to the toolApprovals slice, where the
// chat shows it under its thread (ClientToolApprovals); a request for a thread that is not on
// screen shows here, at the edge of the window, and as a notification. Requests come from the
// desktop app's commands (requestApproval) and from tools the agent's owner marked "Ask before
// running" (gendoxChat); both wait for their answer in approvalAnswers.

const ToolApprovalsContext = createContext(null)

export const useToolApprovals = () => useContext(ToolApprovalsContext)

export const ToolApprovalsProvider = ({ children }) => {
  const dispatch = useDispatch()
  const store = useStore()
  const notifications = useNotifications()
  const pending = useSelector(state => state.toolApprovals.pending)
  const visibleThreadIds = useSelector(state => state.clientDevice.visibleThreadIds)
  const notifiedRef = useRef(new Set())

  /**
   * @param request { executionId, kind: 'command' | 'folder', args: { command, description, cwd }, call, directory, previousResult }
   * @returns a promise of true (allowed) or false
   */
  const requestApproval = useCallback(
    ({ executionId, kind, args, call, directory, previousResult }) => {
      const allowed = waitForAnswer(executionId)
      dispatch(
        approvalRequested({
          id: executionId,
          kind,
          threadId: call?.threadId,
          description: args.description,
          command: args.command,
          directory: directory || args.cwd || null,
          retry: Boolean(previousResult)
        })
      )

      return allowed
    },
    [dispatch]
  )

  const decide = useCallback(
    (id, allowed) => {
      answer(id, allowed)
      dispatch(approvalSettled(id))
    },
    [dispatch]
  )

  // Every new request also becomes a notification, shown when its thread is not on screen
  useEffect(() => {
    for (const request of pending) {
      const id = `approval:${request.id}:${request.kind}`
      if (notifiedRef.current.has(id)) continue
      notifiedRef.current.add(id)
      const thread = Object.values(store.getState().gendoxChat.sessions).find(
        session => session.currentThread?.threadId === request.threadId
      )?.currentThread
      notifications?.publish({
        id,
        kind: 'approval',
        threadId: request.threadId,
        projectId: thread?.projectId,
        organizationId: thread?.organizationId
      })
    }
  }, [pending, notifications, store])

  // Leaving the app answers every open request with no.
  useEffect(() => () => answerAll(false), [])

  const value = useMemo(() => ({ requestApproval, decide }), [requestApproval, decide])
  const offScreen = pending.filter(request => !visibleThreadIds.includes(request.threadId))

  return (
    <ToolApprovalsContext.Provider value={value}>
      {children}
      {offScreen.map(request => (
        <div className='client-pending' key={request.id}>
          <ToolApproval request={request} decide={decide} />
        </div>
      ))}
    </ToolApprovalsContext.Provider>
  )
}

export default ToolApprovalsProvider
