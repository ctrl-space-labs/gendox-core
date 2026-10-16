import { useEffect, useRef } from 'react'
import { ArrowUp, Brain, Paperclip, X } from 'lucide-react'
import { displayFileName, formatBytes } from 'src/components/chat/chatUtils'
import FileTile from 'src/components/ui/FileTile'

const AttachmentTile = ({ attachment, onRemove }) => {
  const busy = ['queued', 'uploading', 'deleting'].includes(attachment.status)
  const name = displayFileName(attachment.uploadedDoc?.title || attachment.file?.name || 'attachment')

  return (
    <span className={`gc-file ${busy ? 'loading' : ''}`}>
      {attachment.isImage && attachment.previewUrl ? (
        <img className='thumb' src={attachment.previewUrl} alt='' />
      ) : (
        <FileTile name={name} />
      )}
      <span style={{ minWidth: 0 }}>
        <span className='trunc' style={{ display: 'block' }}>
          {name}
        </span>
        <span className='faint sm'>
          {attachment.status === 'failed'
            ? 'Upload failed'
            : busy
            ? attachment.status === 'deleting'
              ? 'Removing…'
              : 'Uploading…'
            : formatBytes(attachment.file?.size)}
        </span>
      </span>
      <button type='button' className='x' title='Remove' onClick={() => onRemove(attachment.id)}>
        <X className='lucide' />
      </button>
    </span>
  )
}

/**
 * The message box: text, attached files, Deep thinking and Send.
 * Enter sends, Shift+Enter starts a new line.
 */
const ChatComposer = ({
  value,
  onChange,
  onSend,
  onPaste,
  disabled,
  placeholder,
  attachments,
  onPickFiles,
  onRemoveAttachment,
  deepThinking,
  onDeepThinkingToggle,
  inputRef
}) => {
  const fileInputRef = useRef(null)

  // grow with the text, up to the CSS max-height
  useEffect(() => {
    const textarea = inputRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = value ? Math.min(textarea.scrollHeight, 200) + 'px' : ''
  }, [value, inputRef])

  const submit = e => {
    e.preventDefault()
    if (!disabled) onSend()
  }

  return (
    <form className='gc-composer' onSubmit={submit}>
      {attachments && attachments.length > 0 && (
        <div className='gc-files'>
          {attachments.map(attachment => (
            <AttachmentTile key={attachment.id} attachment={attachment} onRemove={onRemoveAttachment} />
          ))}
        </div>
      )}
      <textarea
        ref={inputRef}
        rows={1}
        placeholder={placeholder}
        aria-label='Message'
        value={value}
        onChange={e => onChange(e.target.value)}
        onPaste={onPaste}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) submit(e)
        }}
      />
      <div className='gc-tools'>
        {onPickFiles && (
          <>
            <input
              ref={fileInputRef}
              type='file'
              multiple
              hidden
              onChange={e => {
                onPickFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <button
              type='button'
              className='btn ghost s icon'
              title='Attach files or images'
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className='lucide' />
            </button>
          </>
        )}
        {onDeepThinkingToggle && (
          <button
            type='button'
            className={`chip ${deepThinking ? 'on' : ''}`}
            title='Slower, more thorough: plans, searches several times and checks its answer'
            onClick={onDeepThinkingToggle}
          >
            <Brain className='lucide' />
            <span className='lbl'>Deep thinking</span>
          </button>
        )}
        <span className='sp' />
        <button className='btn primary s icon gc-send' aria-label='Send' disabled={disabled}>
          <ArrowUp className='lucide' />
        </button>
      </div>
    </form>
  )
}

export default ChatComposer
