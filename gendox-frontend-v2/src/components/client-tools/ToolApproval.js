import ToolApprovalCard from 'src/components/tools/ToolApprovalCard'

const TEXT = {
  command: { title: 'Run command on this computer?', allowLabel: 'Allow' },
  folder: { title: 'Allow writing in another folder?', allowLabel: 'Choose a folder' },
  tool: { title: 'Allow this tool to run?', allowLabel: 'Allow' }
}

const descriptionOf = request => {
  if (request.kind === 'folder') return 'Select the folder you want this command to be allowed to write in.'
  if (request.kind === 'tool') return `The agent wants to run ${request.toolName}.`

  return request.description
}

/** One waiting request from the toolApprovals slice, as an approval card. */
const ToolApproval = ({ request, decide }) => {
  const text = TEXT[request.kind] || TEXT.command

  return (
    <ToolApprovalCard
      title={text.title}
      description={descriptionOf(request)}
      command={request.kind === 'tool' ? request.arguments : request.command}
      directory={request.directory}
      retry={request.retry}
      allowLabel={request.retry ? 'Choose folder and retry' : text.allowLabel}
      onAllow={() => decide(request.id, true)}
      onDecline={() => decide(request.id, false)}
    />
  )
}

export default ToolApproval
