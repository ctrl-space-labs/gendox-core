import { Box } from '@mui/material'
import AttachmentDocPill from './AttachmentDocPill'
import AttachmentImageTile from './AttachmentImageTile'

const AttachmentsRow = ({ attachments, onRemove }) => {
  const docs = attachments.filter(a => !a.isImage)
  const images = attachments.filter(a => a.isImage)

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        alignItems: 'flex-start',
        alignContent: 'flex-start',
        maxHeight: 140,
        overflowY: 'auto',
        overflowX: 'hidden',
        pb: 0.5,
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': { borderRadius: 8 }
      }}
    >
      {docs.map(a => (
        <AttachmentDocPill key={a.id} attachment={a} onRemove={onRemove} />
      ))}

      {images.map(a => (
        <AttachmentImageTile key={a.id} attachment={a} onRemove={onRemove} />
      ))}
    </Box>
  )
}

export default AttachmentsRow
