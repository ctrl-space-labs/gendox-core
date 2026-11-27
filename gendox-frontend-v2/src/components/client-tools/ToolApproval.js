import ToolApprovalCard from 'src/components/tools/ToolApprovalCard'
import { toolTitle } from 'src/utils/clientTools/approvalAnswers'

/** One waiting request from the toolApprovals slice, as an approval card. */
const ToolApproval = ({ request, decide }) => {
  const answer = allowed => () => decide(request.id, allowed)

  // A website or app tool: what it will do, in plain words
  if (request.kind === 'tool') {
    return (
      <ToolApprovalCard
        title={`${toolTitle(request.toolName)}?`}
        fields={request.fields}
        onAllow={answer(true)}
        onDecline={answer(false)}
      />
    )
  }

  // A command on this computer, shown as a terminal shows it
  return (
    <ToolApprovalCard
      title='Run this command on your computer?'
      description={request.description}
      terminal={{ command: request.command, cwd: request.directory }}
      allowLabel='Run'
      onAllow={answer(true)}
      onDecline={answer(false)}
    />
  )
}

export default ToolApproval
