import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import {
  ChevronLeft,
  ChevronRight,
  FilePenLine,
  FileText,
  Library,
  MessageSquareText,
  Pause,
  Play,
  Search,
  SearchX,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react'
import { useAuth } from 'src/authentication/useAuth'
import useActiveScope from 'src/hooks/useActiveScope'
import { fetchProject } from 'src/store/activeProject/activeProject'
import { fetchProjectDocuments } from 'src/store/activeDocument/activeDocument'
import documentService from 'src/gendox-sdk/documentService'
import searchService from 'src/gendox-sdk/searchService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { localStorageConstants } from 'src/utils/generalConstants'
import { isValidOrganizationAndProject } from 'src/utils/validators'
import AppLayout from 'src/layouts/AppLayout'
import AgentScope from 'src/components/agent/AgentScope'
import UploadDialog from 'src/components/knowledge/UploadDialog'
import {
  authorOf,
  createdAtOf,
  fileNameOf,
  formatDate,
  formatDateTime,
  formatSize,
  plural,
  sectionTitleOf,
  sortSections,
  sourceOf,
  tileTypeOf,
  typeNameOf,
  updatedAtOf
} from 'src/components/knowledge/documentUtils'
import { toPlainPreview } from 'src/components/chat/chatUtils'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Empty from 'src/components/ui/Empty'
import FileTile from 'src/components/ui/FileTile'
import Spinner from 'src/components/ui/Spinner'

const PAGE_SIZE = 20
const PASSAGES_PAGE_SIZE = 5

const getToken = () => window.localStorage.getItem(localStorageConstants.accessTokenKey)

// waits until typing stops
const useDebounced = (value, delay) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

// The selected document: its details and first sections (GET documents/{id})
const DocumentPanel = ({ document, members, documentHref, onDelete }) => {
  const [details, setDetails] = useState(null)

  useEffect(() => {
    let current = true
    setDetails(null)
    documentService
      .getDocumentById(document.id, getToken())
      .then(response => current && setDetails(response.data))
      .catch(() => current && setDetails({ failed: true }))

    return () => {
      current = false
    }
  }, [document.id])

  const sections = sortSections(details?.documentInstanceSections)
  const isReady = sections.length > 0
  const author = authorOf(document, members)
  // the full document has the size and page count the list leaves out
  const pages = details?.numberOfPages ?? document.numberOfPages
  const size = details?.fileSizeBytes ?? document.fileSizeBytes

  return (
    <>
      <div className='card-b' style={{ display: 'flex', gap: 14 }}>
        <FileTile name={fileNameOf(document)} type={tileTypeOf(document)} className='big' />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 15, lineHeight: 1.35, wordBreak: 'break-word' }}>{document.title}</h3>
          <div style={{ marginTop: 8 }}>
            {!details ? (
              <span className='faint sm'>Loading…</span>
            ) : isReady ? (
              <span className='badge dot ok'>Ready · {plural(sections.length, 'section')}</span>
            ) : details.failed ? (
              <span className='badge dot err'>Couldn’t load</span>
            ) : (
              <span className='badge dot'>Not processed yet</span>
            )}
          </div>
        </div>
      </div>
      {details && !details.failed && !isReady && (
        <section>
          <p className='muted sm'>
            It has no sections yet, so answers can’t cite it. Sections appear once the document has been processed.
          </p>
        </section>
      )}
      <section>
        <dl className='kv'>
          <dt>Type</dt>
          <dd>{typeNameOf(document)}</dd>
          <dt>Source</dt>
          <dd>
            {sourceOf(document)}
            {document.externalUrl && (
              <>
                {' · '}
                <a className='link' href={document.externalUrl} target='_blank' rel='noopener noreferrer'>
                  {document.externalUrl.replace(/^https?:\/\//, '')}
                </a>
              </>
            )}
          </dd>
          {pages > 0 && (
            <>
              <dt>Pages</dt>
              <dd className='num'>{pages}</dd>
            </>
          )}
          {size > 0 && (
            <>
              <dt>Size</dt>
              <dd className='num'>{formatSize(size)}</dd>
            </>
          )}
          {author && (
            <>
              <dt>Added by</dt>
              <dd>{author}</dd>
            </>
          )}
          <dt>Added</dt>
          <dd>{formatDateTime(createdAtOf(document))}</dd>
          <dt>Updated</dt>
          <dd>{formatDateTime(updatedAtOf(document))}</dd>
        </dl>
      </section>
      {isReady && (
        <section>
          <div className='label'>First sections</div>
          <div className='stack' style={{ gap: 8 }}>
            {sections.slice(0, 3).map(section => (
              <Link
                key={section.id}
                className='src'
                href={documentHref(document.id, section.id)}
                style={{ padding: '8px 10px' }}
              >
                <div style={{ minWidth: 0 }}>
                  {sectionTitleOf(section) && <b style={{ fontWeight: 500 }}>{sectionTitleOf(section)}</b>}
                  <q className='clamp2'>{toPlainPreview(section.sectionValue)}</q>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className='card-f row' style={{ flexWrap: 'wrap' }}>
        <Link className='btn s' href={documentHref(document.id)}>
          <FileText className='lucide' />
          Open
        </Link>
        {isReady && (
          <Link className='btn s' href={`${documentHref(document.id)}&ask=1`}>
            <MessageSquareText className='lucide' />
            Ask about it
          </Link>
        )}
        <span className='sp' />
        <button className='btn ghost s danger' onClick={onDelete}>
          <Trash2 className='lucide' />
          Delete
        </button>
      </div>
    </>
  )
}

// Passages closest in meaning to the query: POST messages/search?projectId
const Passages = ({ query, projectId, documentHref }) => {
  const [passages, setPassages] = useState([])
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const load = useCallback(
    async (nextPage, reset) => {
      setIsLoading(true)
      try {
        const response = await searchService.postSearchMessage(query, projectId, PASSAGES_PAGE_SIZE, nextPage, getToken())
        const found = Array.isArray(response.data) ? response.data : []
        setPassages(list => (reset ? found : [...list, ...found]))
        setHasMore(found.length === PASSAGES_PAGE_SIZE)
        setPage(nextPage)
      } catch (error) {
        toast.error(`Search failed. ${getErrorMessage(error)}`)
      } finally {
        setIsLoading(false)
      }
    },
    [query, projectId]
  )

  useEffect(() => {
    setPassages([])
    if (query.length >= 3) load(0, true)
  }, [query, load])

  if (query.length < 3) {
    return (
      <Empty
        icon={<Sparkles className='lucide' />}
        title='Search inside the documents'
        text='Ask in your own words, e.g. “how long do refunds take”. You’ll get the passages the agent would read.'
      />
    )
  }

  if (isLoading && passages.length === 0) {
    return (
      <div className='center' style={{ padding: 40 }}>
        <Spinner />
      </div>
    )
  }

  if (passages.length === 0) {
    return (
      <Empty
        icon={<SearchX className='lucide' />}
        title='Nothing found'
        text='No processed document has a passage close to this. Try other words.'
      />
    )
  }

  return (
    <>
      {passages.map(passage => {
        const document = passage.documentInstanceDTO || {}
        const title = sectionTitleOf(passage)

        return (
          <div className='passage' key={passage.id}>
            <FileTile name={fileNameOf(document)} type={tileTypeOf(document)} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <Link className='row' href={documentHref(document.id, passage.id)}>
                <b style={{ fontWeight: 550 }} className='trunc'>
                  {document.title}
                </b>
                {title && <span className='faint sm'>· {title}</span>}
              </Link>
              <q className='clamp3'>{toPlainPreview(passage.sectionValue)}</q>
            </div>
          </div>
        )
      })}
      {hasMore && (
        <div className='pager'>
          <button className='btn s' disabled={isLoading} onClick={() => load(page + 1, false)}>
            {isLoading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </>
  )
}

// What the agent reads, searches and cites: its documents.
const KnowledgePage = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { user } = useAuth()
  const { project, organizationId, projectId, href } = useActiveScope()

  const { projectDetails, projectMembers } = useSelector(state => state.activeProject)
  const { projectDocuments, isBlurring } = useSelector(state => state.activeDocument)

  const [mode, setMode] = useState('name')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [checked, setChecked] = useState(() => new Set())
  const [uploadOpen, setUploadOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const panelRef = useRef(null)

  const debouncedQuery = useDebounced(query.trim(), mode === 'name' ? 400 : 800)
  const isValid = isValidOrganizationAndProject(organizationId, projectId, user)
  const details = projectDetails?.id === projectId ? projectDetails : null
  const agentName = details?.name || project?.name || ''

  const documentHref = (documentId, sectionId) =>
    href('/gendox/document-instance', { documentId, ...(sectionId ? { sectionId } : {}) })

  const loadDocuments = useCallback(() => {
    if (!isValid) return
    dispatch(
      fetchProjectDocuments({
        organizationId,
        projectId,
        token: getToken(),
        page,
        size: PAGE_SIZE,
        documentNameContains: mode === 'name' ? debouncedQuery : undefined
      })
    )
  }, [dispatch, isValid, organizationId, projectId, page, mode, debouncedQuery])

  useEffect(() => {
    if (isValid) dispatch(fetchProject({ organizationId, projectId, token: getToken() }))
  }, [dispatch, isValid, organizationId, projectId])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  // a different agent or search starts on the first page with nothing ticked
  useEffect(() => {
    setPage(0)
    setChecked(new Set())
  }, [projectId, debouncedQuery])

  useEffect(() => {
    setSelectedId(null)
  }, [projectId])

  // the palette's "Upload documents" opens the dialog
  useEffect(() => {
    const openFromHash = () => window.location.hash === '#upload' && setUploadOpen(true)
    if (router.isReady) openFromHash()
    router.events.on('hashChangeComplete', openFromHash)

    return () => router.events.off('hashChangeComplete', openFromHash)
  }, [router.isReady, router.events])

  const rows = projectDocuments?.content || []
  const total = projectDocuments?.totalElements || 0
  const totalPages = projectDocuments?.totalPages || 0
  const selected = rows.find(d => d.id === selectedId) || (selectedId ? null : rows[0]) || null
  const hasNoDocuments = !isBlurring && total === 0 && !debouncedQuery && mode === 'name'

  const toggle = id =>
    setChecked(set => {
      const next = new Set(set)
      next.has(id) ? next.delete(id) : next.add(id)

      return next
    })

  const allChecked = rows.length > 0 && rows.every(d => checked.has(d.id))

  const deleteDocuments = async ids => {
    try {
      if (ids.length === 1) await documentService.deleteDocument(organizationId, projectId, ids[0], getToken())
      else await documentService.deleteDocuments(organizationId, projectId, ids, getToken())
      toast.success(ids.length === 1 ? 'Document deleted' : `${ids.length} documents deleted`)
      setChecked(new Set())
      if (ids.includes(selectedId)) setSelectedId(null)
      if (rows.length === ids.length && page > 0) setPage(p => p - 1)
      else loadDocuments()
    } catch (error) {
      toast.error(`Couldn’t delete. ${getErrorMessage(error)}`)
    }
  }

  const processNow = async () => {
    setIsProcessing(true)
    try {
      await documentService.triggerJobs(organizationId, projectId, getToken(), 'SPLITTER_AND_TRAINING', projectId)
      toast.success('Processing started. Documents can be cited once they’re ready.')
    } catch (error) {
      toast.error(`Couldn’t start processing. ${getErrorMessage(error)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const selectRow = document => {
    setSelectedId(document.id)
    if (window.innerWidth < 1100) setTimeout(() => panelRef.current?.scrollIntoView({ block: 'start' }), 0)
  }

  return (
    <main className='content'>
      <div className='vw in-page'>
        <AgentScope project={details} />

        <div className='list-h'>
          <div>
            <h2>Knowledge</h2>
            <p className='muted' style={{ marginTop: 4 }}>
              What {agentName || 'the agent'} reads, searches and cites in its answers.
            </p>
          </div>
          <span className='sp' />
          <Link className='btn' href={href('/gendox/create-document')}>
            <FilePenLine className='lucide' />
            Write
          </Link>
          <button className='btn primary' onClick={() => setUploadOpen(true)}>
            <Upload className='lucide' />
            Upload files
          </button>
        </div>

        {details && details.autoTraining === false && (
          <div className='alert row' style={{ '--c': 'var(--warn)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <b>
                <Pause className='lucide' />
                Auto-processing is off
              </b>
              <span className='muted'>New documents aren’t used in answers until you process them.</span>
            </div>
            <button className='btn s' onClick={processNow} disabled={isProcessing}>
              <Play className='lucide' />
              {isProcessing ? 'Starting…' : 'Process now'}
            </button>
          </div>
        )}

        {hasNoDocuments ? (
          <div className='card'>
            <Empty
              icon={<Library className='lucide' />}
              title={`${agentName || 'This agent'} has no knowledge yet`}
              text='Upload files or write a document. The agent answers from them and cites them.'
              action={
                <div className='row' style={{ justifyContent: 'center' }}>
                  <Link className='btn' href={href('/gendox/create-document')}>
                    <FilePenLine className='lucide' />
                    Write
                  </Link>
                  <button className='btn primary' onClick={() => setUploadOpen(true)}>
                    <Upload className='lucide' />
                    Upload files
                  </button>
                </div>
              }
            />
          </div>
        ) : (
          <div className='kb'>
            <div className='card' style={{ minWidth: 0 }}>
              <div className='toolbar'>
                <label className='search'>
                  <Search className='lucide' />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={mode === 'name' ? 'Find by name…' : 'Ask in your own words…'}
                  />
                </label>
                <div className='pill-tabs' title='By name, or by meaning inside the documents'>
                  <button className={mode === 'name' ? 'on' : ''} onClick={() => setMode('name')}>
                    Name
                  </button>
                  <button className={mode === 'meaning' ? 'on' : ''} onClick={() => setMode('meaning')}>
                    Inside documents
                  </button>
                </div>
              </div>

              {mode === 'meaning' ? (
                <Passages query={debouncedQuery} projectId={projectId} documentHref={documentHref} />
              ) : (
                <>
                  {checked.size > 0 && (
                    <div className='sel-bar'>
                      <b>{checked.size} selected</b>
                      <span className='sp' />
                      <button className='btn ghost s' onClick={() => setChecked(new Set())}>
                        Clear
                      </button>
                      <button
                        className='btn s danger'
                        onClick={() =>
                          setConfirm({
                            title: `Delete ${checked.size} ${checked.size === 1 ? 'document' : 'documents'}?`,
                            text: `They will be removed from ${agentName}’s knowledge, and answers will no longer cite them. This can’t be undone.`,
                            ids: [...checked]
                          })
                        }
                      >
                        <Trash2 className='lucide' />
                        Delete
                      </button>
                    </div>
                  )}
                  {rows.length > 0 ? (
                    <>
                      <div className='scroll'>
                        <table className='table'>
                          <thead>
                            <tr>
                              <th className='chk'>
                                <input
                                  type='checkbox'
                                  aria-label='Select all'
                                  checked={allChecked}
                                  onChange={() =>
                                    setChecked(allChecked ? new Set() : new Set(rows.map(d => d.id)))
                                  }
                                />
                              </th>
                              <th>Name</th>
                              <th className='hide-n'>Type</th>
                              <th className='hide-n'>Updated</th>
                            </tr>
                          </thead>
                          <tbody style={{ opacity: isBlurring ? 0.5 : 1 }}>
                            {rows.map(document => {
                              const author = authorOf(document, projectMembers)

                              return (
                                <tr
                                  key={document.id}
                                  className={selected?.id === document.id ? 'sel' : ''}
                                  onClick={() => selectRow(document)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <td className='chk' onClick={e => e.stopPropagation()}>
                                    <input
                                      type='checkbox'
                                      aria-label='Select'
                                      checked={checked.has(document.id)}
                                      onChange={() => toggle(document.id)}
                                    />
                                  </td>
                                  <td>
                                    <div className='row' style={{ gap: 12, maxWidth: 420 }}>
                                      <FileTile name={fileNameOf(document)} type={tileTypeOf(document)} />
                                      <div style={{ minWidth: 0 }}>
                                        <div className='trunc' style={{ fontWeight: 500 }}>
                                          {document.title}
                                        </div>
                                        <div className='faint sm trunc'>
                                          {sourceOf(document)}
                                          {author ? ` by ${author}` : ''}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className='hide-n muted'>{typeNameOf(document)}</td>
                                  <td className='hide-n muted sm'>{formatDate(updatedAtOf(document))}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className='pager'>
                        <span className='faint sm num'>
                          {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + rows.length} of {total}
                        </span>
                        <span className='sp' />
                        <button
                          className='btn ghost s icon'
                          disabled={page === 0}
                          onClick={() => setPage(p => p - 1)}
                          aria-label='Previous page'
                        >
                          <ChevronLeft className='lucide' />
                        </button>
                        <button
                          className='btn ghost s icon'
                          disabled={page + 1 >= totalPages}
                          onClick={() => setPage(p => p + 1)}
                          aria-label='Next page'
                        >
                          <ChevronRight className='lucide' />
                        </button>
                      </div>
                    </>
                  ) : isBlurring ? (
                    <div className='center' style={{ padding: 40 }}>
                      <Spinner />
                    </div>
                  ) : (
                    <Empty
                      icon={<SearchX className='lucide' />}
                      title='No documents match'
                      text='Try another name, or search inside the documents instead.'
                    />
                  )}
                </>
              )}
            </div>

            <aside className='card panel' ref={panelRef}>
              {selected ? (
                <DocumentPanel
                  key={selected.id}
                  document={selected}
                  members={projectMembers}
                  documentHref={documentHref}
                  onDelete={() =>
                    setConfirm({
                      title: 'Delete this document?',
                      text: `“${selected.title}” will be removed from ${agentName}’s knowledge. Answers will no longer cite it.`,
                      ids: [selected.id]
                    })
                  }
                />
              ) : (
                <div className='card-b faint sm'>Choose a document to see its details.</div>
              )}
            </aside>
          </div>
        )}
      </div>

      <UploadDialog
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false)
          if (window.location.hash === '#upload') history.replaceState(null, '', window.location.pathname + window.location.search)
        }}
        organizationId={organizationId}
        projectId={projectId}
        agentName={agentName}
        autoTraining={details?.autoTraining !== false}
        onUploaded={loadDocuments}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        text={confirm?.text}
        onConfirm={() => deleteDocuments(confirm.ids)}
      />
    </main>
  )
}

KnowledgePage.getLayout = page => (
  <AppLayout page='knowledge' title='Knowledge'>
    {page}
  </AppLayout>
)

KnowledgePage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default KnowledgePage
