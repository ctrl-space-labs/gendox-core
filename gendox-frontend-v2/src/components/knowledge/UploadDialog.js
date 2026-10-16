import { useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import documentService from 'src/gendox-sdk/documentService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { localStorageConstants } from 'src/utils/generalConstants'
import { formatBytes } from 'src/components/chat/chatUtils'
import Dialog from 'src/components/ui/Dialog'
import FileTile from 'src/components/ui/FileTile'

// the extensions the backend accepts (gendox.documents.allowed.extensions)
const ALLOWED = ['txt', 'md', 'rst', 'csv', 'pdf', 'docx', 'doc', 'xls', 'xlsx', 'jpg']
const BATCH_SIZE = 10

const extensionOf = name => (name.includes('.') ? name.split('.').pop().toLowerCase() : '')

/**
 * Upload files into an agent's knowledge: POST …/documents/upload, ten at a time.
 * Files start uploading as soon as they are chosen or dropped.
 * @param onUploaded - called once a round of uploads has finished, to refresh the list
 */
const UploadDialog = ({ open, onClose, organizationId, projectId, agentName, autoTraining, onUploaded }) => {
  const [items, setItems] = useState([])
  const [isOver, setIsOver] = useState(false)
  const inputRef = useRef(null)
  const nextId = useRef(0)

  const update = (id, changes) => setItems(list => list.map(item => (item.id === id ? { ...item, ...changes } : item)))

  const upload = async item => {
    update(item.id, { status: 'uploading' })
    const formData = new FormData()
    formData.append('file', item.file)
    try {
      const token = window.localStorage.getItem(localStorageConstants.accessTokenKey)
      await documentService.uploadDocument(organizationId, projectId, formData, token)
      update(item.id, { status: 'uploaded' })
    } catch (error) {
      update(item.id, { status: 'failed', error: getErrorMessage(error) })
    }
  }

  const addFiles = async fileList => {
    const added = Array.from(fileList || []).map(file => {
      const extension = extensionOf(file.name)
      const allowed = ALLOWED.includes(extension)

      return {
        id: nextId.current++,
        file,
        status: allowed ? 'queued' : 'failed',
        error: allowed
          ? null
          : `${extension ? extension.toUpperCase() + ' files' : 'Files without an extension'} can’t be uploaded.`
      }
    })
    if (added.length === 0) return
    setItems(list => [...list, ...added])

    const queued = added.filter(item => item.status === 'queued')
    for (let index = 0; index < queued.length; index += BATCH_SIZE) {
      await Promise.all(queued.slice(index, index + BATCH_SIZE).map(upload))
    }
    if (queued.length > 0) onUploaded?.()
  }

  const close = () => {
    if (items.some(item => item.status === 'uploading' || item.status === 'queued')) return
    setItems([])
    onClose()
  }

  const uploaded = items.filter(item => item.status === 'uploaded').length
  const busy = items.some(item => item.status === 'uploading' || item.status === 'queued')

  const note = busy
    ? `Uploading ${uploaded + 1} of ${items.filter(item => item.status !== 'failed').length}…`
    : uploaded > 0
    ? autoTraining
      ? `${uploaded} uploaded. They’ll be ready to cite once they’re processed.`
      : `${uploaded} uploaded. Process them to use them in answers.`
    : ''

  const onDrag = (e, over) => {
    e.preventDefault()
    setIsOver(over)
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title='Upload files'
      subtitle={agentName ? `Added to ${agentName}’s knowledge.` : undefined}
      footer={
        <>
          <span className='faint sm' style={{ marginRight: 'auto' }}>
            {note}
          </span>
          <button className='btn' onClick={close} disabled={busy}>
            {busy ? 'Uploading…' : 'Close'}
          </button>
        </>
      }
    >
      <label
        className={`dropzone ${isOver ? 'over' : ''}`}
        onDragEnter={e => onDrag(e, true)}
        onDragOver={e => onDrag(e, true)}
        onDragLeave={e => onDrag(e, false)}
        onDrop={e => {
          onDrag(e, false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <span className='ftype big' style={{ '--h': 165 }}>
          <FileUp className='lucide' />
        </span>
        <b>Drop files here, or click to choose</b>
        <span className='faint sm'>PDF, Word, Excel, CSV, text, Markdown or JPG</span>
        <input
          ref={inputRef}
          type='file'
          multiple
          hidden
          accept={ALLOWED.map(extension => '.' + extension).join(',')}
          onChange={e => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </label>

      {items.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {items.map(item => (
            <div className='upl' key={item.id}>
              <FileTile name={item.file.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className='row sm'>
                  <span className='trunc'>{item.file.name}</span>
                  <span className='sp' />
                  <span className='faint'>
                    {item.status === 'uploaded'
                      ? 'Uploaded'
                      : item.status === 'failed'
                      ? ''
                      : item.status === 'uploading'
                      ? 'Uploading…'
                      : formatBytes(item.file.size)}
                  </span>
                </div>
                {item.status === 'failed' ? (
                  <div className='sm' style={{ color: 'var(--err)' }}>
                    {item.error}
                  </div>
                ) : (
                  <div className='progress' style={{ height: 4, marginTop: 6 }}>
                    <i
                      style={{
                        width: item.status === 'uploaded' ? '100%' : item.status === 'uploading' ? '60%' : '0%',
                        transition: 'width .6s'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  )
}

export default UploadDialog
