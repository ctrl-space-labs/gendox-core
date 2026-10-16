import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ChevronDown,
  CircleDashed,
  Columns3,
  Download,
  FilePlus,
  LoaderCircle,
  Play,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Square,
  Table2
} from 'lucide-react'
import useActiveScope from 'src/hooks/useActiveScope'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { downloadBlobForCSV } from 'src/utils/tasks/downloadBlobForCSV'
import { getToken } from 'src/components/agent/useAgent'
import { plural } from 'src/components/knowledge/documentUtils'
import { TaskTile } from 'src/components/tasks/taskUtils'
import { TaskFormDialog } from 'src/components/tasks/TaskDialogs'
import {
  FLAGS,
  Flag,
  KIND,
  answerOf as answerFromNode,
  documentOf,
  isDecision,
  kindOf,
  percent,
  questionLabel,
  questionOf
} from 'src/components/tasks/insightUtils'
import InsightsInspector, { docTabOf, useDocumentNames } from 'src/components/tasks/InsightsInspector'
import DocumentPicker, { findDocuments } from 'src/components/tasks/DocumentPicker'
import useSplitPane from 'src/components/tasks/useSplitPane'
import useTaskJob, { jobParam } from 'src/components/tasks/useTaskJob'
import { ViewMain, useScreenTitle, useView } from 'src/views/ViewContext'
import ConfirmDialog from 'src/components/ui/ConfirmDialog'
import Empty from 'src/components/ui/Empty'
import Menu from 'src/components/ui/Menu'
import Spinner from 'src/components/ui/Spinner'

const ALL = 2147483647

/** What the inspector shows, read from and written to the URL: ?doc=&q=&tab=, or ?doc=new for new questions */
const viewFromQuery = query => {
  const { doc, q, tab } = query
  if (doc === 'new') return { kind: 'new' }
  if (doc && q) return { kind: 'answer', docId: doc, qId: q }
  if (doc) return { kind: 'doc', docId: doc, tab }
  if (q) return { kind: 'q', qId: q, tab }

  return null
}

/**
 * Document insights: documents × questions, one answer per cell (DOCUMENT, QUESTION and ANSWER task nodes).
 * POST …/task-nodes/search for the documents (a page) and the questions (all), POST …/answers for their answers.
 * Generating runs a job (useTaskJob). Clicking an answer, a document or a question opens the inspector beside the table.
 */
const DocumentInsightsView = () => {
  const screen = useView()
  const { taskId } = screen.query
  const { organizationId, projectId, project, href } = useActiveScope()
  const split = useSplitPane('gx-ins')

  const [task, setTask] = useState(null)
  useScreenTitle(task?.title)
  const [failed, setFailed] = useState(false)
  const [docs, setDocs] = useState(null)
  const [total, setTotal] = useState(0)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState(new Map())
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [view, setView] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [picker, setPicker] = useState(null)
  const [editing, setEditing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [pending, setPending] = useState(null) // what the job just started covers, until its own parameters arrive
  const inspRef = useRef(null)

  // ---------- data ----------
  const loadTask = useCallback(() => {
    if (!organizationId || !projectId || !taskId) return
    taskService
      .getTaskById(organizationId, projectId, taskId, getToken())
      .then(response => setTask(response.data))
      .catch(() => setFailed(true))
  }, [organizationId, projectId, taskId])

  const docsRef = useRef([])
  const questionsRef = useRef([])

  const loadAnswers = useCallback(
    async (docList = docsRef.current, questionList = questionsRef.current) => {
      if (!docList.length || !questionList.length) return setAnswers(new Map())
      const response = await taskService.getAnswerTaskNodes(
        organizationId,
        projectId,
        taskId,
        { documentNodeIds: docList.map(d => d.id), questionNodeIds: questionList.map(q => q.id) },
        getToken(),
        0,
        ALL
      )
      const map = new Map()
      ;(response.data?.content ?? []).map(answerFromNode).forEach(a => map.set(`${a.documentNodeId}_${a.questionNodeId}`, a))
      setAnswers(map)
    },
    [organizationId, projectId, taskId]
  )

  const load = useCallback(async () => {
    if (!organizationId || !projectId || !taskId) return
    const token = getToken()
    try {
      const [docsResponse, questionsResponse] = await Promise.all([
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
        taskService.getTaskNodesByCriteria(organizationId, projectId, taskId, { taskId, nodeTypeNames: ['QUESTION'] }, token, 0, ALL)
      ])
      const docNodes = docsResponse.data?.content ?? []
      const questionList = (questionsResponse.data?.content ?? []).map(questionOf).sort((a, b) => a.order - b.order)
      const ids = docNodes.map(n => n.documentId).filter(Boolean)
      const [found] = await Promise.all([
        ids.length ? findDocuments(organizationId, projectId, { ids, size: ids.length }).catch(() => null) : null,
        loadAnswers(docNodes, questionList).catch(() => {})
      ])
      const titles = Object.fromEntries((found?.content ?? []).map(d => [d.id, d.title]))
      const docList = docNodes.map(node =>
        documentOf({
          ...node,
          nodeValue: {
            ...node.nodeValue,
            documentMetadata: { ...(node.nodeValue?.documentMetadata ?? {}), title: titles[node.documentId] }
          }
        })
      )
      docsRef.current = docList
      questionsRef.current = questionList
      setDocs(docList)
      setTotal(docsResponse.data?.totalElements ?? docList.length)
      setQuestions(questionList)
    } catch (error) {
      toast.error(getErrorMessage(error))
      setDocs(d => d ?? [])
    }
  }, [organizationId, projectId, taskId, search, page, pageSize, loadAnswers])

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

  // ---------- generating ----------
  const job = useTaskJob({
    organizationId,
    projectId,
    taskId,
    onTick: () => loadAnswers().catch(() => {}),
    onFinished: status => {
      setPending(null)
      setSelected(new Set())
      load()
      if (status === 'COMPLETED') toast.success('Answers generated')
      else if (status === 'STOPPED') toast('Generating stopped')
      else toast.error('Generating ended with an error. Some answers may be missing.')
    }
  })

  const generate = useCallback(
    criteria => {
      setPending(criteria)
      job.start(criteria)
    },
    [job]
  )

  const target = useMemo(() => {
    if (!job.running) return null
    const params = job.job?.job
    const docIds = params ? jobParam(params, 'documentNodeIds') : pending?.documentNodeIds
    const qIds = params ? jobParam(params, 'questionNodeIds') : pending?.questionNodeIds
    const regen = params ? String(jobParam(params, 'reGenerateExistingAnswers')) === 'true' : pending?.reGenerateExistingAnswers

    return { docIds: Array.isArray(docIds) ? docIds : [], qIds: Array.isArray(qIds) ? qIds : [], regen: !!regen }
  }, [job.running, job.job, pending])

  const isTarget = (docId, qId) =>
    !!target && (!target.docIds.length || target.docIds.includes(docId)) && (!target.qIds.length || target.qIds.includes(qId))

  // ---------- the inspector ----------
  const answerOf = useCallback((docId, qId) => answers.get(`${docId}_${qId}`) ?? null, [answers])

  const setUrl = useCallback(
    next => {
      screen.set({
        doc: next?.kind === 'new' ? 'new' : next?.docId,
        q: next?.qId,
        tab: next?.tab
      })
    },
    [screen]
  )

  const open = useCallback(
    next => {
      setView(next)
      setUrl(next)
      requestAnimationFrame(() => inspRef.current?.focus({ preventScroll: true }))
    },
    [setUrl]
  )

  const close = useCallback(() => {
    setView(null)
    setUrl(null)
  }, [setUrl])

  // the URL opens the same answer, document or question again
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current || !screen.ready || docs === null) return
    restored.current = true
    const initial = viewFromQuery(screen.query)
    if (initial) setView(initial)
  }, [screen.ready, screen.query, docs])

  const step = useCallback(
    (dr, dc) => {
      if (!view || !docs) return
      if (dr && view.docId) {
        const list = view.kind === 'answer' ? docs.filter(d => answerOf(d.id, view.qId)) : docs
        const next = list[list.findIndex(d => d.id === view.docId) + dr]
        if (next) open({ ...view, docId: next.id, tab: view.kind === 'doc' ? view.tab : undefined })
      }
      if (dc && view.qId) {
        const next = questions[questions.findIndex(q => q.id === view.qId) + dc]
        if (next) open({ ...view, qId: next.id })
      }
    },
    [view, docs, questions, answerOf, open]
  )

  useEffect(() => {
    const onKey = e => {
      // in the dock, only the window that has the focus
      if (screen.mode === 'dock' && !split.ref.current?.contains(e.target)) return
      if (!view || e.target?.matches?.('input, textarea, select') || e.metaKey || e.ctrlKey) return
      if (document.querySelector('.modal-bg, .pop')) return
      if (e.key === 'Escape') return close()
      const move = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key]
      if (!move) return
      if (view.kind === 'answer' || (view.kind === 'doc' && move[0]) || (view.kind === 'q' && move[1])) {
        e.preventDefault()
        step(...move)
      }
    }
    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [view, step, close])

  // keep what the inspector shows in sight in the table
  useEffect(() => {
    const wrap = document.querySelector('.ins-card .grid-wrap')
    if (!wrap || !view) return
    const box = wrap.getBoundingClientRect()
    const cell = wrap.querySelector('td.cur, th.q.on')
    if (cell) {
      const left = wrap.querySelector('th.doc')?.offsetWidth ?? 0
      const x = cell.getBoundingClientRect().left - box.left
      if (x < left || x + cell.offsetWidth > wrap.clientWidth) wrap.scrollLeft += x - left
    }
    const row = wrap.querySelector('tr.on')
    if (row) {
      const y = row.getBoundingClientRect().top - box.top
      if (y < 40 || y > wrap.clientHeight - 50) wrap.scrollTop += y - 80
    }
  }, [view])

  const moveQuestion = async (qId, dir) => {
    const list = [...questions]
    const i = list.findIndex(q => q.id === qId)
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    const ordered = list.map((q, order) => ({ ...q, order }))
    questionsRef.current = ordered
    setQuestions(ordered)
    try {
      await taskService.reorderTaskQuestionNodes(organizationId, projectId, taskId, ordered.map(q => q.id), getToken())
    } catch (error) {
      toast.error(getErrorMessage(error))
      load()
    }
  }

  const supportIds = useMemo(
    () => [...(docs ?? []).flatMap(d => d.supportingDocumentIds), ...questions.flatMap(q => q.supportingDocumentIds)],
    [docs, questions]
  )
  const names = useDocumentNames(organizationId, projectId, supportIds)
  const [pickedNames, setPickedNames] = useState(names)
  useEffect(() => setPickedNames(names), [names])

  // ---------- table actions ----------
  const ask = spec => setConfirm(spec)

  const missingCount = useMemo(() => {
    if (!docs) return 0
    const rows = selected.size ? docs.filter(d => selected.has(d.id)) : docs

    return rows.reduce((n, d) => n + questions.filter(q => !answerOf(d.id, q.id)).length, 0)
  }, [docs, questions, selected, answerOf])

  const generateMissing = () =>
    ask({
      title: selected.size ? `Generate for ${plural(selected.size, 'document')}?` : 'Generate missing answers?',
      text: selected.size
        ? 'Empty cells in the selected rows are filled. Existing answers are kept.'
        : `Every empty cell is filled${total > (docs?.length ?? 0) ? ', on every page of the table' : ''}. Existing answers are kept.`,
      label: 'Generate',
      danger: false,
      onOk: () => generate({ documentNodeIds: [...selected], questionNodeIds: [], reGenerateExistingAnswers: false })
    })

  const regenerateAll = () =>
    ask({
      title: selected.size ? `Regenerate ${plural(selected.size, 'document')}?` : 'Regenerate every answer?',
      text: selected.size
        ? 'Every answer in the selected rows is replaced, including ones you have checked. This can’t be undone.'
        : 'Every answer in the task is replaced, including ones you have checked. This can’t be undone.',
      label: selected.size ? 'Regenerate' : 'Regenerate all',
      onOk: () => generate({ documentNodeIds: [...selected], questionNodeIds: [], reGenerateExistingAnswers: true })
    })

  const exportAll = async () => {
    setExporting(true)
    try {
      const blob = await taskService.documentInsightsExportAllCSV(organizationId, projectId, taskId, getToken())
      downloadBlobForCSV(blob, `${(task?.title ?? 'document_insights').replace(/\s+/g, '_')}.csv`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setExporting(false)
    }
  }

  const addDocuments = async ids => {
    if (!ids.length) return
    const payloads = ids.map(documentId => ({ taskId, nodeType: 'DOCUMENT', documentId }))
    for (let i = 0; i < payloads.length; i += 20) {
      await taskService.createTaskNodesBatch(organizationId, projectId, payloads.slice(i, i + 20), getToken())
    }
    toast.success(`${plural(ids.length, 'document')} added`)
    setPage(0)
    load()
  }

  const openAddDocuments = async () => {
    // every document already in the task, not only this page, so none is added twice
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
      subtitle: `Pick from ${project?.name ?? 'the agent'}’s knowledge, or upload new files.`,
      taken,
      onPick: addDocuments
    })
  }

  const toggleRow = id =>
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)

      return next
    })

  // ---------- render ----------
  if (failed) {
    return (
      <ViewMain>
        <div className='card'>
          <Empty
            icon={<Table2 className='lucide' />}
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
  const progress = (() => {
    if (!target || !docs) return null
    const cells = docs.flatMap(d => questions.filter(q => isTarget(d.id, q.id)).map(q => answerOf(d.id, q.id)))

    return { done: cells.filter(Boolean).length, all: cells.length }
  })()

  const inspectorCtx = {
    docs: docs ?? [],
    questions,
    total,
    answerOf,
    full: split.full,
    toggleFull: split.toggleFull,
    open,
    close,
    step,
    ask,
    generate,
    running: job.running,
    href,
    organizationId,
    projectId,
    taskId,
    reload: load,
    names: pickedNames,
    moveQuestion,
    pickDocuments: spec => setPicker(spec)
  }

  const viewOn = view ?? {}

  return (
    <ViewMain fill>
      {task && screen.mode === 'page' && (
        <Head>
          <title>{`${task.title} · Gendox`}</title>
        </Head>
      )}
        <div ref={split.ref} className={`ins ${view ? 'open' : ''} ${split.full ? 'full' : ''} ${split.resizing ? 'resizing' : ''}`}>
          <div
            className='ins-main'
            onClick={e => {
              if (view && !e.target.closest('button, a, input, select, textarea, label, tr, .cell, .pop')) close()
            }}
          >
            <div className='task-h' data-only='page'>
              <Link className='btn ghost s icon' href={href('/gendox/tasks')} title='Back to Tasks'>
                <ArrowLeft className='lucide' />
              </Link>
              <TaskTile type='DOCUMENT_INSIGHTS' className='big' />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1 className='trunc'>{task?.title ?? ' '}</h1>
                <div className='faint sm trunc'>Document insights{task?.description ? ` · ${task.description}` : ''}</div>
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
                <button className='btn s' onClick={() => open({ kind: 'new' })}>
                  <Columns3 className='lucide' />
                  <span className='hide-l'>Add questions</span>
                </button>
                <label className='search'>
                  <Search className='lucide' />
                  <input placeholder='Find a document' value={query} onChange={e => setQuery(e.target.value)} />
                </label>
                <span className='sp' />
                <button className='btn s' title='Export every answer as CSV' onClick={exportAll} disabled={exporting || !answers.size}>
                  <Download className='lucide' />
                  <span className='hide-l'>CSV</span>
                </button>
                <div className='split-btn'>
                  <button className='btn s primary' onClick={generateMissing} disabled={job.running || !questions.length || !docs?.length}>
                    <Sparkles className='lucide' />
                    <span className='hide-l'>{selected.size ? `Generate selected (${selected.size})` : 'Generate missing'}</span>
                  </button>
                  <Menu
                    align='right'
                    width={300}
                    trigger={({ onClick }) => (
                      <button
                        className='btn s primary'
                        title='More ways to generate'
                        onClick={onClick}
                        disabled={job.running || !questions.length || !docs?.length}
                      >
                        <ChevronDown className='lucide' />
                      </button>
                    )}
                  >
                    <button className='mi tall' data-close-menu onClick={generateMissing}>
                      <Sparkles className='lucide' />
                      <span>
                        <b>{selected.size ? 'Generate missing in the selected rows' : 'Generate missing'}</b>
                        <span className='faint sm'>
                          Only empty cells{missingCount ? ` (${missingCount} on this page)` : ''}. Nothing is overwritten.
                        </span>
                      </span>
                    </button>
                    <button className='mi tall' data-close-menu onClick={regenerateAll}>
                      <RefreshCw className='lucide' />
                      <span>
                        <b>{selected.size ? 'Regenerate the selected rows' : 'Regenerate everything'}</b>
                        <span className='faint sm'>Replaces existing answers too.</span>
                      </span>
                    </button>
                  </Menu>
                </div>
              </div>

              {job.running && (
                <div className='run'>
                  <LoaderCircle className='lucide turning' />
                  <b style={{ fontWeight: 500 }} className='hide-l'>
                    {job.stopping ? 'Stopping…' : 'Generating answers'}
                  </b>
                  {progress && progress.all > 0 && !target?.regen ? (
                    <>
                      <div className='progress' style={{ flex: 1, minWidth: 100, height: 5 }}>
                        <i style={{ width: `${(progress.done / progress.all) * 100}%` }} />
                      </div>
                      <span className='num faint sm'>
                        {progress.done} of {progress.all} on this page
                      </span>
                    </>
                  ) : (
                    <span className='sp' />
                  )}
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
                ) : !docs.length && !questions.length && !search ? (
                  <Empty
                    icon={<Table2 className='lucide' />}
                    title='Add documents and questions'
                    text='Each document becomes a row and each question a column. The AI answers every question for every document.'
                    action={
                      <div className='row' style={{ gap: 8, justifyContent: 'center' }}>
                        <button className='btn' onClick={openAddDocuments}>
                          <FilePlus className='lucide' />
                          Add documents
                        </button>
                        <button className='btn primary' onClick={() => open({ kind: 'new' })}>
                          <Columns3 className='lucide' />
                          Add questions
                        </button>
                      </div>
                    }
                  />
                ) : (
                  <table className='ig'>
                    <thead>
                      <tr>
                        <th className={`doc ${viewOn.kind === 'doc' ? 'on' : ''}`}>
                          <div>
                            <input
                              type='checkbox'
                              aria-label='Select every document on this page'
                              checked={docs.length > 0 && docs.every(d => selected.has(d.id))}
                              onChange={e => setSelected(e.target.checked ? new Set(docs.map(d => d.id)) : new Set())}
                            />
                            Document
                          </div>
                        </th>
                        {questions.map(q => (
                          <th
                            key={q.id}
                            className={`q ${(viewOn.kind === 'q' || viewOn.kind === 'answer') && viewOn.qId === q.id ? 'on' : ''}`}
                          >
                            <button className='qh' title={q.text} onClick={() => open({ kind: 'q', qId: q.id, tab: 'setup' })}>
                              <span className='trunc'>{questionLabel(q)}</span>
                              {isDecision(q) && <span className='kind'>{KIND[kindOf(q)]}</span>}
                            </button>
                          </th>
                        ))}
                        {!questions.length && (
                          <th className='q'>
                            <button className='qh' onClick={() => open({ kind: 'new' })}>
                              <Columns3 className='lucide' style={{ width: 14, height: 14 }} />
                              Add a question
                            </button>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map(d => {
                        const summary = d.summary?.answerValue || d.summary?.answerText ? d.summary : null
                        const rowRunning = questions.some(q => isTarget(d.id, q.id) && !answerOf(d.id, q.id))

                        return (
                          <tr
                            key={d.id}
                            className={`${selected.has(d.id) ? 'sel' : ''} ${viewOn.docId === d.id && viewOn.kind !== 'q' ? 'on' : ''}`}
                          >
                            <td className='doc'>
                              <div>
                                <input
                                  type='checkbox'
                                  aria-label={`Select ${d.name}`}
                                  checked={selected.has(d.id)}
                                  onChange={() => toggleRow(d.id)}
                                />
                                {summary ? (
                                  <button
                                    className='flagbtn'
                                    title={`Summary: ${summary.answerValue ?? ''}`}
                                    onClick={() => open({ kind: 'doc', docId: d.id, tab: 'summary' })}
                                  >
                                    <Flag flag={summary.answerFlagEnum} />
                                  </button>
                                ) : (
                                  <span className='flagbtn'>
                                    {rowRunning ? (
                                      <LoaderCircle className='lucide turning' style={{ width: 15 }} />
                                    ) : questions.length && questions.every(q => !answerOf(d.id, q.id)) ? (
                                      <CircleDashed className='lucide' style={{ width: 15 }} />
                                    ) : null}
                                  </span>
                                )}
                                <button
                                  className='dn'
                                  title={d.name}
                                  onClick={() =>
                                    open({ kind: 'doc', docId: d.id, tab: docTabOf(d, questions.some(q => answerOf(d.id, q.id))) })
                                  }
                                >
                                  {d.name}
                                </button>
                              </div>
                            </td>
                            {questions.map(q => {
                              const a = answerOf(d.id, q.id)
                              const cur = viewOn.kind === 'answer' && viewOn.docId === d.id && viewOn.qId === q.id
                              const busy = isTarget(d.id, q.id) && (!a || target.regen)

                              return (
                                <td key={q.id} className={`q ${cur ? 'cur' : ''}`}>
                                  {busy && !a ? (
                                    <div className='cell empty'>
                                      <LoaderCircle className='lucide turning' style={{ width: 15 }} />
                                      Generating…
                                    </div>
                                  ) : a ? (
                                    <button className='cell' onClick={() => open({ kind: 'answer', docId: d.id, qId: q.id })}>
                                      <Flag flag={a.flag} />
                                      <span className='v'>{a.value || <em className='faint'>See the details</em>}</span>
                                      {a.decision?.probability != null && <span className='p'>{percent(a.decision.probability)}%</span>}
                                      {busy && <LoaderCircle className='lucide turning' style={{ width: 13, color: 'var(--text-3)' }} />}
                                    </button>
                                  ) : (
                                    <button
                                      className='cell empty'
                                      disabled={job.running}
                                      onClick={() =>
                                        generate({ documentNodeIds: [d.id], questionNodeIds: [q.id], reGenerateExistingAnswers: false })
                                      }
                                    >
                                      <Play className='lucide' style={{ width: 14 }} />
                                      Generate
                                    </button>
                                  )}
                                </td>
                              )
                            })}
                            {!questions.length && <td className='q' />}
                          </tr>
                        )
                      })}
                      {!docs.length && (
                        <tr>
                          <td className='doc'>
                            <div className='faint sm'>{search ? 'No documents match.' : 'No documents yet.'}</div>
                          </td>
                          {questions.map(q => (
                            <td key={q.id} className='q' />
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              <div className='ins-foot'>
                <span className='faint sm'>Rows per page</span>
                <select
                  className='input s'
                  style={{ width: 'auto' }}
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value))
                    setPage(0)
                  }}
                >
                  {[20, 50, 100].map(n => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
                <span className='faint sm num'>
                  {total ? `${page * pageSize + 1}–${Math.min(total, (page + 1) * pageSize)} of ${total}` : '0 documents'}
                </span>
                {pages > 1 && (
                  <>
                    <button className='btn ghost s' disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                      Previous
                    </button>
                    <button className='btn ghost s' disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>
                      Next
                    </button>
                  </>
                )}
                <span className='sp' />
                <span className='faint sm hide-l'>
                  {['OK', 'INFO', 'WARNING', 'MAJOR_ISSUE', 'NA'].map(flag => (
                    <span key={flag} className='row' style={{ display: 'inline-flex', gap: 4, marginLeft: 12 }}>
                      <Flag flag={flag} />
                      {FLAGS[flag].text}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>
          <div className='ins-gut' title='Drag to resize' onPointerDown={split.onPointerDown} />
          <section className='insp' tabIndex={-1} ref={inspRef}>
            {view && docs && <InsightsInspector key={`${view.kind}-${view.docId}-${view.qId}`} view={view} ctx={inspectorCtx} />}
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
        okLabel={picker?.okLabel}
        taken={picker?.taken}
        initial={picker?.initial}
        onPick={async ids => {
          await picker.onPick(ids)
          // names of documents just picked as supporting ones
          const unknown = ids.filter(id => !(id in pickedNames))
          if (unknown.length) {
            const found = await findDocuments(organizationId, projectId, { ids: unknown, size: unknown.length }).catch(() => null)
            setPickedNames(n => ({ ...n, ...Object.fromEntries((found?.content ?? []).map(d => [d.id, d.title])) }))
          }
        }}
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

export default DocumentInsightsView
