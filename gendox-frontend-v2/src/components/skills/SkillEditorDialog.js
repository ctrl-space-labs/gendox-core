import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Copy, Download, Upload } from 'lucide-react'
import { parseSkill } from 'src/utils/skillMarkdown'
import Dialog from 'src/components/ui/Dialog'

/**
 * The SKILL.md editor: the file itself is the editor (write, paste or upload), and name and description are read
 * from its front matter, checked as you type.
 *
 * @param readOnly - shows a Gendox skill; onEditCopy then offers "Edit a copy"
 * @param knownTools - the built-in tool names, so the check flags a tool in allowed-tools that Gendox doesn't have
 * @param onSave - (content, parsed) => Promise | void
 * @param onDownload - (content) adds a Download button
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
  onClose,
  onSave,
  onEditCopy,
  onDownload
}) => {
  const [content, setContent] = useState(initialContent || '')
  const [isSaving, setIsSaving] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (open) setContent(initialContent || '')
  }, [open, initialContent])

  const parsed = useMemo(() => parseSkill(content, knownTools), [content, knownTools])

  const upload = event => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => setContent(String(e.target.result || ''))
    reader.readAsText(file)
    event.target.value = ''
  }

  const save = async () => {
    setIsSaving(true)
    try {
      await onSave(content, parsed)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      busy={isSaving}
      open={open}
      onClose={onClose}
      size='l'
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <span className='faint sm' style={{ marginRight: 'auto' }}>
            {footerNote}
          </span>
          <button className='btn' onClick={onClose}>
            {readOnly ? 'Close' : 'Cancel'}
          </button>
          {onDownload && (
            <button className='btn' onClick={() => onDownload(content)}>
              <Download className='lucide' />
              Download
            </button>
          )}
          {readOnly && onEditCopy && (
            <button className='btn primary' onClick={() => onEditCopy(content)}>
              <Copy className='lucide' />
              Edit a copy
            </button>
          )}
          {!readOnly && (
            <button
              aria-busy={isSaving}
              className='btn primary'
              onClick={save}
              disabled={isSaving || parsed.errors.length > 0}
            >
              {saveLabel}
            </button>
          )}
        </>
      }
    >
      {!readOnly && (
        <div className='row' style={{ marginBottom: 12, flexWrap: 'wrap' }}>
          <button className='btn s' onClick={() => fileRef.current?.click()}>
            <Upload className='lucide' />
            Upload SKILL.md
          </button>
          <input ref={fileRef} type='file' accept='.md,text/markdown' hidden onChange={upload} />
          <span className='faint sm'>
            The format Claude Code and Codex use:{' '}
            <a className='link' href='https://agentskills.io' target='_blank' rel='noreferrer'>
              Agent Skills
            </a>
          </span>
        </div>
      )}

      <textarea
        className='input mono'
        rows={18}
        style={{ whiteSpace: 'pre', fontSize: 13 }}
        value={content}
        readOnly={readOnly}
        onChange={e => setContent(e.target.value)}
      />

      {!readOnly && (
        <div style={{ marginTop: 10 }}>
          {parsed.errors.length === 0 ? (
            <span className='row sm' style={{ color: 'var(--ok)', alignItems: 'flex-start' }}>
              <CircleCheck className='lucide' />
              <span>
                <b>{parsed.name}</b>: {parsed.description}
                {parsed.tools.length > 0 && ` · brings ${parsed.tools.join(', ')}`}
              </span>
            </span>
          ) : (
            parsed.errors.map(error => (
              <span key={error} className='row sm' style={{ color: 'var(--err)' }}>
                <CircleAlert className='lucide' />
                {error}
              </span>
            ))
          )}
        </div>
      )}
    </Dialog>
  )
}

export default SkillEditorDialog
