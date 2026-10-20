import { useEffect, useMemo, useRef, useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { parseSkill } from 'src/utils/skillMarkdown'

/**
 * The SKILL.md editor: the file itself is the editor (write, paste or upload), and name and
 * description are read from its front matter, checked as you type.
 *
 * readOnly shows a Gendox skill; onEditCopy then offers "Edit a copy". onDownload adds a Download button. knownTools (the built-in
 * tool names) lets the check flag a tool in allowed-tools that Gendox doesn't have.
 */
const SkillEditorDialog = ({
  open,
  title,
  subtitle,
  initialContent,
  knownTools,
  readOnly = false,
  footerNote,
  saveLabel = 'Save',
  saving = false,
  onClose,
  onSave,
  onEditCopy,
  onDownload
}) => {
  const [content, setContent] = useState(initialContent || '')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (open) setContent(initialContent || '')
  }, [open, initialContent])

  const parsed = useMemo(() => parseSkill(content, knownTools), [content, knownTools])

  const handleUpload = event => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => setContent(String(e.target.result || ''))
    reader.readAsText(file)
    event.target.value = ''
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth scroll='paper' PaperProps={{ sx: { overflowX: 'hidden' } }}>
      <DialogTitle sx={{ pr: 8 }}>
        {title}
        {subtitle && (
          <Typography variant='body2' sx={{ color: 'text.secondary', mt: 1 }}>
            {subtitle}
          </Typography>
        )}
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 16, top: 16 }}>
          <Icon icon='mdi:close' />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ overflowX: 'hidden', pt: 2, pb: 4, px: 6 }}>
        {!readOnly && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Button variant='outlined' size='small' startIcon={<Icon icon='mdi:upload' />} onClick={() => fileInputRef.current?.click()}>
              Upload SKILL.md
            </Button>
            <input ref={fileInputRef} type='file' accept='.md,text/markdown' hidden onChange={handleUpload} />
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
              The format Claude Code and Codex use:{' '}
              <Link href='https://agentskills.io' target='_blank' rel='noopener noreferrer'>
                Agent Skills
              </Link>
            </Typography>
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          minRows={18}
          value={content}
          onChange={e => setContent(e.target.value)}
          InputProps={{
            readOnly,
            sx: { fontFamily: 'Source Code Pro, monospace', whiteSpace: 'pre', fontSize: 14 }
          }}
        />

        {!readOnly && (
          <Box sx={{ mt: 2 }}>
            {parsed.errors.length === 0 ? (
              <Typography variant='body2' sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon icon='mdi:check-circle-outline' fontSize={18} />
                <span>
                  <strong>{parsed.name}</strong>: {parsed.description}
                  {parsed.tools.length > 0 && ` · brings ${parsed.tools.join(', ')}`}
                </span>
              </Typography>
            ) : (
              parsed.errors.map(error => (
                <Typography key={error} variant='body2' sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon icon='mdi:alert-circle-outline' fontSize={18} />
                  {error}
                </Typography>
              ))
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 6, py: 3, mt: 2, justifyContent: 'space-between' }}>
        <Typography variant='body2' sx={{ color: 'text.secondary' }}>
          {footerNote}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
          {onDownload && (
            <Button variant='outlined' startIcon={<Icon icon='mdi:download-outline' />} onClick={() => onDownload(content)}>
              Download
            </Button>
          )}
          {readOnly && onEditCopy && (
            <Button variant='contained' startIcon={<Icon icon='mdi:content-copy' />} onClick={() => onEditCopy(content)}>
              Edit a copy
            </Button>
          )}
          {!readOnly && (
            <Button variant='contained' disabled={saving || parsed.errors.length > 0} onClick={() => onSave(content, parsed)}>
              {saveLabel}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  )
}

export default SkillEditorDialog
