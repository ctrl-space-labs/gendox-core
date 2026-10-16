import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, ChevronDown, FilePlus, LoaderCircle, MessageSquareDashed, RefreshCw, ScanText, Search, Settings2, Sparkles, Square } from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { isDocumentDigitizationFileTypeSupported } from 'src/utils/tasks/fileFormats'
import { getToken } from 'src/components/agent/useAgent'
import { fileNameOf, plural } from 'src/components/knowledge/documentUtils'
import { TaskTile } from 'src/components/tasks/taskUtils'
import { TaskFormDialog } from 'src/components/tasks/TaskDialogs'
import DocumentPicker, { findDocuments } from 'src/components/tasks/DocumentPicker'
import DigitizationReader from 'src/components/tasks/DigitizationReader'
import useSplitPane from 'src/components/tasks/useSplitPane'
import useTaskJob, { jobParam } from 'src/components/tasks/useTaskJob'
import { ViewMain, useScreenTitle, useView } from 'src/views/ViewContext'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Empty from 'src/components/ui/Empty'
import FileTile from 'src/components/ui/FileTile'
import Menu from 'src/components/ui/Menu'
import Spinner from 'src/components/ui/Spinner'

const ALL = 2147483647

/**
 * Digitization: documents turned into text page by page. DOCUMENT task nodes (POST …/task-nodes/search, a page),
 * with how many pages each has and how many are done (GET …/tasks/{t}/document-pages). Opening one shows the reader.
 */
const DigitizationView = () => {
  const screen = useView()
  const { taskId } = screen.query
  const { organizationId, projectId, project, href } = useActiveScope()
  const split = useSplitPane('gx-dz')

  const [task, setTask] = useState(null)
  useScreenTitle(task?.title)
  const [failed, setFailed] = useState(false)
  const [docs, setDocs] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [openId, setOpenId] = useState(null)
  const [tab, setTabState] = useState('result')
  const [confirm, setConfirm] = useState(null)
  const [picker, setPicker] = useState(null)
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(null)
  const inspRef = useRef(null)

  const loadTask = useCallback(() => {
    if (!organizationId || !projectId || !taskId) return
    taskService
      .getTaskById(organizationId, projectId, taskId, getToken())
      .then(response => setTask(response.data))
      .catch(() => setFailed(true))
  }, [organizationId, projectId, taskId])

  const load = useCallback(async () => {
    if (!organizationId || !projectId || !taskId) return
    const token = getToken()
    try {
      const [nodesResponse, pagesResponse] = await Promise.all([
        taskService.getTaskNodesByCriteria(
          organizationId,
          projectId,
          taskId,
          { taskId, nodeTypeNames: ['DOCUMENT'], ...(search ? { documentNameContains: search } : {}) },
          token,
          page,
          pageSize,
          'createdAt,desc'
        ),
        taskService.getDocumentPages(organizationId, projectId, taskId, token, 0, ALL)
      ])
      const nodes = nodesResponse.data?.content ?? []
      const counts = Object.fromEntries((pagesResponse.data?.content ?? pagesResponse.data ?? []).map(p => [p.taskDocumentNodeId, p]))
      const ids = nodes.map(n => n.documentId).filter(Boolean)
      const found = ids.length ? await findDocuments(organizationId, projectId, { ids, size: ids.length }).catch(() => null) : null
      const files = Object.fromEntries((found?.content ?? []).map(d => [d.id, d]))
      setDocs(
        nodes.map(node => {
          const meta = node.nodeValue?.documentMetadata ?? {}
          const file = files[node.documentId]
          const fileName = file ? fileNameOf(file) : ''
          const count = counts[node.id]

          return {
            id: node.id,
            documentId: node.documentId,
            name: file?.title || fileName || 'Untitled document',
            fileName,
            unsupported: !!fileName && !isDocumentDigitizationFileTypeSupported(fileName),
            prompt: meta.prompt || '',
            structure: meta.structure || '',
            pageFrom: meta.pageFrom ?? null,
            pageTo: meta.pageTo ?? null,
            allPages: !!meta.allPages,
            pages: count?.documentPages || 0,
            done: count?.numberOfNodePages || 0
          }
        })
      )
      setTotal(nodesResponse.data?.totalElements ?? nodes.length)
    } catch (error) {
      toast.error(getErrorMessage(error))
      setDocs(d => d ?? [])
    }
  }, [organizationId, projectId, taskId, search, page, pageSize])

  useEffect(loadTask, [loadTask])
  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim())
      setPage(0)
    }, 350)

    return () => clearTimeout(timer)
  }, [query])

  // ---------- digitizing ----------
  const job = useTaskJob({
    organizationId,
    projectId,
    taskId,
    onTick: load,
    onFinished: status => {
      setPending(null)
      setSelected(new Set())
      load()
      if (status === 'COMPLETED') toast.success('Digitizing finished')
      else if (status === 'STOPPED') toast('Digitizing stopped')
      else toast.error('Digitizing ended with an error. Some pages may be missing.')
    }
  })

  const generate = useCallback(
    criteria => {
      setPending(criteria)
      job.start(criteria)
    },
    [job]
  )

  const targetIds = useMemo(() => {
    if (!job.running) return null
    const ids = job.job?.job ? jobParam(job.job.job, 'documentNodeIds') : pending?.documentNodeIds

    return Array.isArray(ids) ? ids : []
  }, [job.running, job.job, pending])
  const isBusy = id => !!targetIds && (!targetIds.length || targetIds.includes(id))

  // ---------- the reader ----------
  const setUrl = useCallback(
    (id, t) => {
      screen.set({ doc: id, tab: id && t === 'setup' ? 'setup' : null })
    },
    [screen]
  )

  // a document not digitized yet opens on its instructions
  const open = useCallback(
    (doc, t) => {
      const next = t ?? (doc.done || doc.unsupported ? 'result' : 'setup')
      setOpenId(doc.id)
      setTabState(next)
      setUrl(doc.id, next)
      requestAnimationFrame(() => inspRef.current?.focus({ preventScroll: true }))
    },
    [setUrl]
  )

  const close = useCallback(() => {
    setOpenId(null)
    setUrl(null)
  }, [setUrl])

  const restored = useRef(false)
  useEffect(() => {
    if (restored.current || !screen.ready || docs === null) return
    restored.current = true
    const doc = docs.find(d => d.id === screen.query.doc)
    if (doc) open(doc, screen.query.tab === 'setup' ? 'setup' : undefined)
  }, [screen.ready, screen.query, docs, open])

  const current = docs?.find(d => d.id === openId) ?? null

  const step = useCallback(
    dir => {
      if (!docs || !openId) return
      const next = docs[docs.findIndex(d => d.id === openId) + dir]
      if (next) open(next)
    },
    [docs, openId, open]
  )

  useEffect(() => {
    const onKey = e => {
      // in the dock, only the window that has the focus
      if (screen.mode === 'dock' && !split.ref.current?.contains(e.target)) return
      if (!openId || e.target?.matches?.('input, textarea, select') || e.metaKey || e.ctrlKey) return
      if (document.querySelector('.modal-bg, .pop')) return
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        step(e.key === 'ArrowUp' ? -1 : 1)
      }
    }
    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [openId, step, close])

  // ---------- list actions ----------
  const ask = spec => setConfirm(spec)
  const supported = (docs ?? []).filter(d => !d.unsupported)
  const missingPages = (docs ?? []).reduce((n, d) => n + (d.unsupported ? 0 : Math.max(0, d.pages - d.done)), 0)

  const digitizeMissing = () =>
    ask({
      title: selected.size ? `Digitize ${plural(selected.size, 'document')}?` : 'Digitize missing pages?',
      text: selected.size
        ? 'Missing pages of the selected documents are digitized. Pages already done are kept.'
        : 'Missing pages of every document are digitized. Pages already done are kept.',
      label: 'Digitize',
      danger: false,
      onOk: () => generate({ documentNodeIds: [...selected], reGenerateExistingAnswers: false })
    })

  const digitizeAll = () =>
    ask({
      title: selected.size ? `Digitize ${plural(selected.size, 'document')} again?` : 'Digitize everything again?',
      text: 'Every page is read again and its text replaced. This can’t be undone.',
      label: selected.size ? 'Digitize again' : 'Digitize all',
      onOk: () => generate({ documentNodeIds: [...selected], reGenerateExistingAnswers: true })
    })

  const openAddDocuments = async () => {
    let taken = []
    try {
      const response = await taskService.getTaskNodesByCriteria(
        organizationId,
        projectId,
        taskId,
        { taskId, nodeTypeNames: ['DOCUMENT'] },
        getToken(),
        0,
        ALL
      )
      taken = (response.data?.content ?? []).map(n => n.documentId)
    } catch {}
    setPicker({
      title: 'Add documents',
      subtitle: `Pick from ${project?.name ?? 'the agent'}’s knowledge, or upload scans and PDFs.`,
      taken,
      onPick: async ids => {
        if (!ids.length) return
        const payloads = ids.map(documentId => ({ taskId, nodeType: 'DOCUMENT', documentId }))
        for (let i = 0; i < payloads.length; i += 20) {
          await taskService.createTaskNodesBatch(organizationId, projectId, payloads.slice(i, i + 20), getToken())
        }
        toast.success(`${plural(ids.length, 'document')} added`)
        setPage(0)
        load()
      }
    })
  }

  const toggleRow = id =>
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)

      return next
    })

  if (failed) {
    return (
      <ViewMain>
        <div className='card'>
          <Empty
            icon={<ScanText className='lucide' />}
            title='This task isn’t available'
            text='It may have been deleted.'
            action={
              <Link className='btn' href={href('/gendox/tasks')}>
                <ArrowLeft className='lucide' />
                Tasks
              </Link>
            }
          />
        </div>
      </ViewMain>
    )
  }

  const pages = Math.max(1, Math.ceil(total / pageSize))
  const doneTotal = (docs ?? []).reduce((n, d) => n + d.done, 0)
  const pagesTotal = (docs ?? []).reduce((n, d) => n + d.pages, 0)
  const statusOf = d =>
    d.unsupported
      ? ['', 'Can’t be digitized']
      : isBusy(d.id) && (!d.pages || d.done < d.pages || pending?.reGenerateExistingAnswers)
      ? ['info', 'Digitizing']
      : d.pages && d.done >= d.pages
      ? ['ok', 'Digitized']
      : d.done
      ? ['warn', `${plural(d.pages - d.done, 'page')} missing`]
      : ['', 'Not digitized']

  const readerCtx = {
    organizationId,
    projectId,
    taskId,
    task,
    full: split.full,
    toggleFull: split.toggleFull,
    close,
    step,
    setTab: t => {
      setTabState(t)
      setUrl(openId, t)
    },
    ask,
    generate,
    running: job.running,
    busy: current ? isBusy(current.id) : false,
    href,
    reload: load
  }

  return (
    <ViewMain fill>
      {task && screen.mode === 'page' && (
        <Head>
          <title>{`${task.title} · Gendox`}</title>
        </Head>
      )}
        <div ref={split.ref} className={`ins dz ${openId ? 'open' : ''} ${split.full ? 'full' : ''} ${split.resizing ? 'resizing' : ''}`}>
          <div
            className='ins-main'
            onClick={e => {
              if (openId && !e.target.closest('button, a, input, select, textarea, label, tr, .pop')) close()
            }}
          >
            <div className='task-h' data-only='page'>
              <Link className='btn ghost s icon' href={href('/gendox/tasks')} title='Back to Tasks'>
                <ArrowLeft className='lucide' />
              </Link>
              <TaskTile type='DOCUMENT_DIGITIZATION' className='big' />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 className='trunc'>{task?.title ?? ' '}</h1>
                <div className='faint sm trunc'>
                  Digitization{task?.description ? ` · ${task.description}` : ''}
                  {task && ` · reads ${task.usePrintedPage && task.usePageText ? 'an image and the text of each page' : task.usePageText ? 'the text of each page' : 'an image of each page'}`}
                </div>
              </div>
              <button className='btn ghost s icon' title='Task settings' onClick={() => setEditing(true)} disabled={!task}>
                <Settings2 className='lucide' />
              </button>
            </div>

            <div className='card ins-card'>
              <div className='toolbar'>
                <button className='btn s' onClick={openAddDocuments}>
                  <FilePlus className='lucide' />
                  <span className='hide-l'>Add documents</span>
                </button>
                <label className='search'>
                  <Search className='lucide' />
                  <input placeholder='Find a document' value={query} onChange={e => setQuery(e.target.value)} />
                </label>
                <span className='sp' />
                <div className='split-btn'>
                  <button className='btn s primary' onClick={digitizeMissing} disabled={job.running || !supported.length}>
                    <Sparkles className='lucide' />
                    <span className='hide-l'>{selected.size ? `Digitize selected (${selected.size})` : 'Digitize missing pages'}</span>
                  </button>
                  <Menu
                    align='right'
                    width={300}
                    trigger={({ onClick }) => (
                      <button className='btn s primary' onClick={onClick} disabled={job.running || !supported.length} title='More ways to digitize'>
                        <ChevronDown className='lucide' />
                      </button>
                    )}
                  >
                    <button className='mi tall' data-close-menu onClick={digitizeMissing}>
                      <Sparkles className='lucide' />
                      <span>
                        <b>Digitize missing pages</b>
                        <span className='faint sm'>
                          {missingPages ? `${plural(missingPages, 'page')} on this page of the list. ` : ''}Done pages are kept.
                        </span>
                      </span>
                    </button>
                    <button className='mi tall' data-close-menu onClick={digitizeAll}>
                      <RefreshCw className='lucide' />
                      <span>
                        <b>{selected.size ? 'Digitize the selected again' : 'Digitize everything again'}</b>
                        <span className='faint sm'>Replaces the text of every page.</span>
                      </span>
                    </button>
                  </Menu>
                </div>
              </div>

              {job.running && (
                <div className='run'>
                  <LoaderCircle className='lucide turning' />
                  <b style={{ fontWeight: 500 }}>{job.stopping ? 'Stopping…' : 'Digitizing'}</b>
                  <span className='sp' />
                  <button className='btn s' onClick={job.stop} disabled={job.stopping}>
                    <Square className='lucide' />
                    Stop
                  </button>
                </div>
              )}

              <div className='grid-wrap'>
                {docs === null ? (
                  <div className='center' style={{ minHeight: 0, padding: 60 }}>
                    <Spinner />
                  </div>
                ) : !docs.length && !search ? (
                  <Empty
                    icon={<ScanText className='lucide' />}
                    title='Add the documents to digitize'
                    text='Scans, PDFs and office files. Each page is read and turned into text you can search, copy and export.'
                    action={
                      <button className='btn primary' onClick={openAddDocuments}>
                        <FilePlus className='lucide' />
                        Add documents
                      </button>
                    }
                  />
                ) : (
                  <table className='table'>
                    <thead>
                      <tr>
                        <th className='chk'>
                          <input
                            type='checkbox'
                            aria-label='Select every document that can be digitized'
                            checked={supported.length > 0 && supported.every(d => selected.has(d.id))}
                            onChange={e => setSelected(e.target.checked ? new Set(supported.map(d => d.id)) : new Set())}
                          />
                        </th>
                        <th>Document</th>
                        <th className='hide-l'>Status</th>
                        <th className='hide-l'>Pages</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map(d => {
                        const [color, label] = statusOf(d)

                        return (
                          <tr
                            key={d.id}
                            data-i={d.id}
                            className={`${selected.has(d.id) ? 'sel' : ''} ${d.id === openId ? 'on' : ''}`}
                            onClick={e => !e.target.closest('td.chk') && open(d)}
                          >
                            <td className='chk'>
                              <input
                                type='checkbox'
                                aria-label={`Select ${d.name}`}
                                disabled={d.unsupported}
                                title={d.unsupported ? 'This format can’t be digitized' : undefined}
                                checked={selected.has(d.id)}
                                onChange={() => toggleRow(d.id)}
                              />
                            </td>
                            <td>
                              <div className='row' style={{ gap: 12, maxWidth: 420 }}>
                                <FileTile name={d.fileName} />
                                <div style={{ minWidth: 0 }}>
                                  <div className='trunc' style={{ fontWeight: 500 }}>
                                    {d.name}
                                  </div>
                                  <div className='show-l' style={{ marginTop: 4 }}>
                                    <span className={`badge dot ${color}`}>{label}</span>
                                    {d.pages > 0 && (
                                      <span className='faint sm num' style={{ marginLeft: 8 }}>
                                        {d.done}/{d.pages}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className='hide-l'>
                              <div className='row' style={{ gap: 6, flexWrap: 'wrap' }}>
                                <span className={`badge dot ${color}`}>{label}</span>
                                {!d.unsupported && !d.prompt && (
                                  <span className='badge' title='No instructions for this document'>
                                    <MessageSquareDashed className='lucide' />
                                    No instructions
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className='hide-l' style={{ minWidth: 110 }}>
                              {d.pages ? (
                                <div className='row sm' style={{ gap: 8 }}>
                                  <div className='progress' style={{ flex: 1, height: 5 }}>
                                    <i style={{ width: `${Math.min(100, (d.done / d.pages) * 100)}%` }} />
                                  </div>
                                  <span className='num faint'>
                                    {d.done}/{d.pages}
                                  </span>
                                </div>
                              ) : (
                                <span className='faint'>—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {!docs.length && (
                        <tr>
                          <td colSpan={4} className='faint sm'>
                            No documents match.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              <div className='ins-foot'>
                <span className='faint sm num'>
                  {plural(total, 'document')}
                  {pagesTotal ? ` · ${doneTotal} of ${pagesTotal} pages digitized${pages > 1 ? ' on this page' : ''}` : ''}
                </span>
                <span className='sp' />
                {total > 20 && (
                  <select
                    className='input s'
                    style={{ width: 'auto' }}
                    value={pageSize}
                    aria-label='Rows per page'
                    onChange={e => {
                      setPageSize(Number(e.target.value))
                      setPage(0)
                    }}
                  >
                    {[20, 50, 100].map(n => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                )}
                {pages > 1 && (
                  <>
                    <button className='btn ghost s' disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                      Previous
                    </button>
                    <span className='faint sm num'>
                      {page + 1} / {pages}
                    </span>
                    <button className='btn ghost s' disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>
                      Next
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className='ins-gut' title='Drag to resize' onPointerDown={split.onPointerDown} />
          <section className='insp' tabIndex={-1} ref={inspRef}>
            {current && <DigitizationReader key={current.id} doc={current} tab={tab} ctx={readerCtx} />}
          </section>
        </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onOk()}
        title={confirm?.title}
        text={confirm?.text}
        confirmLabel={confirm?.label ?? 'Delete'}
        danger={confirm?.danger ?? true}
      />
      <DocumentPicker
        open={!!picker}
        onClose={() => setPicker(null)}
        organizationId={organizationId}
        projectId={projectId}
        title={picker?.title}
        subtitle={picker?.subtitle}
        taken={picker?.taken}
        onPick={ids => picker.onPick(ids)}
      />
      {task && (
        <TaskFormDialog
          open={editing}
          task={task}
          organizationId={organizationId}
          projectId={projectId}
          onClose={() => setEditing(false)}
          onSaved={saved => setTask(saved ?? task)}
        />
      )}
    </ViewMain>
  )
}

export default DigitizationView
