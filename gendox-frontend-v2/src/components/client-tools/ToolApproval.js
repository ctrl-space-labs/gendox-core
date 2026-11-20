import ToolApprovalCard from 'src/components/tools/ToolApprovalCard'

const TEXT = {
  command: { title: 'Run command on this computer?', allowLabel: 'Allow' },
  folder: { title: 'Allow writing in another folder?', allowLabel: 'Choose a folder' }
}

/** One waiting request from the toolApprovals slice, as an approval card. */
const ToolApproval = ({ request, decide }) => {
  const text = TEXT[request.kind] || TEXT.command

  return (
    <ToolApprovalCard
      title={text.title}
      description={
        request.kind === 'folder'
          ? 'Select the folder you want this command to be allowed to write in.'
          : request.description
      }
      command={request.command}
      directory={request.directory}
      retry={request.retry}
      allowLabel={request.retry ? 'Choose folder and retry' : text.allowLabel}
      onAllow={() => decide(request.id, true)}
      onDecline={() => decide(request.id, false)}
    />
  )
}

export default ToolApproval
