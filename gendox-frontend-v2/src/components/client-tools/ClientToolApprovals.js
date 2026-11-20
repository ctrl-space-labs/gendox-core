import { useSelector } from 'react-redux'
import ToolApproval from 'src/components/client-tools/ToolApproval'
import { useToolApprovals } from 'src/components/client-tools/ToolApprovalsProvider'

/** The approvals waiting in one chat thread, shown under its messages. */
const ClientToolApprovals = ({ threadId }) => {
  const approvals = useToolApprovals()
  const pending = useSelector(state => state.toolApprovals.pending)
  if (!approvals) return null

  return pending
    .filter(request => request.threadId === threadId)
    .map(request => <ToolApproval key={request.id} request={request} decide={approvals.decide} />)
}

export default ClientToolApprovals
