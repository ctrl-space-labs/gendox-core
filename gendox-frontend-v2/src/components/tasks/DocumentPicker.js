import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Search, Upload } from 'lucide-react'
import documentService from 'src/gendox-sdk/documentService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { getToken } from 'src/components/agent/useAgent'
import { fileNameOf, plural } from 'src/components/knowledge/documentUtils'
import Dialog from 'src/components/ui/Dialog'
import FileTile from 'src/components/ui/FileTile'
import Spinner from 'src/components/ui/Spinner'

const PAGE_SIZE = 20

/** POST …/documents/search by ids or by name, one page */
export const findDocuments = (organizationId, projectId, { ids, name, page = 0, size = PAGE_SIZE } = {}) =>
  documentService
    .findDocumentsByCriteria(
      organizationId,
      projectId,
      {
        organizationId,
        projectId,
        ...(ids?.length ? { documentInstanceIds: ids.map(String) } : {}),
        ...(name ? { documentNameContains: name } : {})
      },
      getToken(),
      page,
      size
    )
    .then(response => response.data)

/**
 * Pick documents from the agent's knowledge, or upload new ones (they are picked once uploaded).
 * @param taken - document ids that are already in use (shown, not pickable), e.g. already in the task
 * @param initial - document ids picked when it opens, e.g. the current supporting documents
 * @param onPick - (ids) => Promise; the dialog closes when it resolves
 * @param onPickOne - (document) => void; picks a single document with one click instead (no upload)
 */
const DocumentPicker = ({
  open,
  onClose,
  title = 'Add documents',
  subtitle,
  okLabel = n => `Add ${plural(n, 'document')}`,
  organizationId,
  projectId,
  taken = [],
  initial = [],
  onPick,
  onPickOne
}) => {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [result, setResult] = useState(null)
  const [picked, setPicked] = useState(new Set())
  const [uploading, setUploading] = useState(0)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)
  const takenSet = new Set(taken)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setPage(0)
    setPicked(new Set(initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const load = () =>
    findDocuments(organizationId, projectId, { name: query.trim(), page })
      .then(setResult)
      .catch(() => setResult({ content: [], totalElements: 0 }))

  useEffect(() => {
    if (!open || !organizationId || !projectId) return
    const timer = setTimeout(load, query ? 250 : 0)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, organizationId, projectId, query, page])

  const toggle = id =>
    setPicked(set => {
      const next = new Set(set)
      next.has(id) ? next.delete(id) : next.add(id)

      return next
    })

  const upload = async files => {
    const list = Array.from(files || [])
    if (!list.length) return
    setUploading(n => n + list.length)
    for (const file of list) {
      try {
        const response = await documentService.uploadSingleDocument(organizationId, projectId, file, getToken())
        const id = response.data?.id
        if (id) setPicked(set => new Set(set).add(id))
      } catch (error) {
        toast.error(`${file.name}: ${getErrorMessage(error)}`)
      } finally {
        setUploading(n => n - 1)
      }
    }
    setPage(0)
    load()
  }

  const changed = [...picked].filter(id => !takenSet.has(id))
  const count = initial.length ? picked.size : changed.length
  const same = initial.length && picked.size === initial.length && initial.every(id => picked.has(id))

  const save = async () => {
    setSaving(true)
    try {
      await onPick(initial.length || !taken.length ? [...picked] : changed)
      onClose()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const docs = result?.content ?? []
  const pages = Math.ceil((result?.totalElements ?? 0) / PAGE_SIZE)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size='l'
      footer={
        onPickOne ? null : (
        <>
          <span className='faint sm' style={{ marginRight: 'auto' }}>
            {uploading ? `Uploading ${plural(uploading, 'file')}…` : `${count} selected`}
          </span>
          <button className='btn' onClick={onClose}>
            Cancel
          </button>
          <button
            className='btn primary'
            onClick={save}
            disabled={saving || uploading > 0 || same || (!initial.length && changed.length === 0)}
          >
            {typeof okLabel === 'function' ? okLabel(count) : okLabel}
          </button>
        </>
        )
      }
    >
      <div className='row' style={{ marginBottom: 12, gap: 8 }}>
        <label className='search' style={{ flex: 1, minWidth: 0 }}>
          <Search className='lucide' />
          <input
            placeholder='Find documents'
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setPage(0)
            }}
          />
        </label>
        {!onPickOne && (
          <>
            <button className='btn s' onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
              <Upload className='lucide' />
              Upload
            </button>
            <input ref={fileRef} type='file' multiple hidden onChange={e => upload(e.target.files).then(() => (e.target.value = ''))} />
          </>
        )}
      </div>
      {result === null ? (
        <div className='center' style={{ minHeight: 0, padding: 32 }}>
          <Spinner />
        </div>
      ) : docs.length === 0 ? (
        <p className='faint sm' style={{ padding: '24px 0', textAlign: 'center' }}>
          {query ? 'No documents match.' : onPickOne ? 'This agent has no documents yet.' : 'This agent has no documents yet. Upload some.'}
        </p>
      ) : (
        <table className='table'>
          <tbody>
            {docs.map(doc => {
              const inUse = takenSet.has(doc.id) && !initial.length
              const pick = () => {
                if (inUse) return
                if (!onPickOne) return toggle(doc.id)
                onPickOne(doc)
                onClose()
              }

              return (
                <tr key={doc.id} style={{ cursor: inUse ? 'default' : 'pointer' }} onClick={pick}>
                  {!onPickOne && (
                  <td className='chk'>
                    <input
                      type='checkbox'
                      checked={inUse || picked.has(doc.id)}
                      disabled={inUse}
                      onChange={() => toggle(doc.id)}
                      onClick={e => e.stopPropagation()}
                      aria-label={`Pick ${doc.title}`}
                    />
                  </td>
                  )}
                  <td>
                    <div className='row' style={{ gap: 10 }}>
                      <FileTile name={fileNameOf(doc)} />
                      <span className='trunc'>{doc.title || fileNameOf(doc)}</span>
                    </div>
                  </td>
                  <td className='muted sm' style={{ textAlign: 'right' }}>
                    {inUse ? 'In this task' : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
      {pages > 1 && (
        <div className='row sm' style={{ justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
          <span className='faint num'>
            Page {page + 1} of {pages}
          </span>
          <button className='btn s' disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            Previous
          </button>
          <button className='btn s' disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>
            Next
          </button>
        </div>
      )}
    </Dialog>
  )
}

export default DocumentPicker
