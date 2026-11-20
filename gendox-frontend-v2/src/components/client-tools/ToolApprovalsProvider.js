import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { approvalRequested, approvalSettled } from 'src/store/toolApprovals/toolApprovals'
import { useNotifications } from 'src/components/client-tools/NotificationsProvider'
import ToolApproval from 'src/components/client-tools/ToolApproval'

// Asks the user before a tool call runs. The request goes to the toolApprovals slice, where the
// chat shows it under its thread (ClientToolApprovals); a request for a thread that is not on
// screen shows here, at the edge of the window, and as a notification.

const ToolApprovalsContext = createContext(null)

export const useToolApprovals = () => useContext(ToolApprovalsContext)

export const ToolApprovalsProvider = ({ children }) => {
  const dispatch = useDispatch()
  const store = useStore()
  const notifications = useNotifications()
  const pending = useSelector(state => state.toolApprovals.pending)
  const visibleThreadIds = useSelector(state => state.clientDevice.visibleThreadIds)
  // The promise of each request waits here for the user's answer, by request id.
  const answersRef = useRef(new Map())

  /**
   * @param request { executionId, kind: 'command' | 'folder', args: { command, description, cwd }, call, directory, previousResult }
   * @returns a promise of true (allowed) or false
   */
  const requestApproval = useCallback(
    ({ executionId, kind, args, call, directory, previousResult }) =>
      new Promise(resolve => {
        answersRef.current.get(executionId)?.(false)
        answersRef.current.set(executionId, resolve)
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
        const thread = Object.values(store.getState().gendoxChat.sessions).find(
          session => session.currentThread?.threadId === call?.threadId
        )?.currentThread
        notifications?.publish({
          ...call,
          id: `approval:${executionId}:${kind}`,
          kind: 'approval',
          projectId: thread?.projectId,
          organizationId: thread?.organizationId
        })
      }),
    [dispatch, store, notifications]
  )

  const decide = useCallback(
    (id, allowed) => {
      answersRef.current.get(id)?.(allowed)
      answersRef.current.delete(id)
      dispatch(approvalSettled(id))
    },
    [dispatch]
  )

  // Leaving the app answers every open request with no.
  useEffect(() => {
    const answers = answersRef.current

    return () => {
      answers.forEach(resolve => resolve(false))
      answers.clear()
    }
  }, [])

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
