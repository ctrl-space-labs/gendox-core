import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDashed,
  Copy,
  Download,
  FileText,
  Maximize2,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  TriangleAlert,
  X
} from 'lucide-react'
import documentService from 'src/gendox-sdk/documentService'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { copyToClipboard } from 'src/utils/copyToClipboard'
import { getToken } from 'src/components/agent/useAgent'
import Markdown from 'src/components/chat/Markdown'
import Empty from 'src/components/ui/Empty'
import Spinner from 'src/components/ui/Spinner'
import { formatDateTime, plural, sectionTitleOf, sortSections } from 'src/components/knowledge/documentUtils'
import {
  FLAGS,
  Flag,
  KIND,
  flagText,
  insightConfigOf,
  isDecision,
  kindOf,
  percent,
  questionChanged,
  questionForm,
  questionLabel,
  questionProblem
} from 'src/components/tasks/insightUtils'
import QuestionForm, { SupportingList } from 'src/components/tasks/QuestionForm'

const IconButton = ({ icon: Icon, title, onClick, disabled, ...rest }) => (
  <button className='btn ghost s icon' title={title} aria-label={title} onClick={onClick} disabled={disabled} {...rest}>
    <Icon className='lucide' />
  </button>
)

const Tabs = ({ tabs, current, onChange }) => (
  <div className='tabs insp-tabs'>
    {tabs.map(([key, label, count]) => (
      <button key={key} className={current === key ? 'on' : ''} onClick={() => onChange(key)}>
        {label}
        {count != null && <span className='n'>{count}</span>}
      </button>
    ))}
  </div>
)

/** A decision's result: each option with how likely the AI found it (decisionResult.probabilities, legend) */
const DecisionResult = ({ question, answer }) => {
  const d = answer.decision
  const options = Object.entries(d.probabilities ?? {})

  return (
    <div className='fact-block'>
      <div className='label'>How sure the AI is</div>
      {options.length > 0 ? (
        <div className='stack' style={{ gap: 8 }}>
          {options.map(([key, p]) => {
            const label = d.legend?.[key] ?? key
            const on = key === d.selectedValue || label === answer.value

            return (
              <div key={key} className={`opt ${on ? 'on' : ''}`}>
                <span>
                  {label}
                  {d.kind === 'CHOICE' && label !== key && <code className='faint'> {key}</code>}
                </span>
                <div className='progress'>
                  <i style={{ width: `${percent(p)}%` }} />
                </div>
                <b className='num'>{percent(p)}%</b>
              </div>
            )
          })}
        </div>
      ) : (
        <p className='faint sm'>No probabilities were stored for this answer.</p>
      )}
      <div className='row' style={{ flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
        <span className='badge'>{KIND[d.kind] ?? KIND[kindOf(question)]}</span>
        {d.probability != null && <span className='badge'>Probability {percent(d.probability)}%</span>}
        {d.confidence != null && <span className='badge'>Confidence {percent(d.confidence)}%</span>}
        {d.score != null && <span className='badge'>Score {d.score}</span>}
        {d.modelVersion && <span className='badge'>{d.modelVersion}</span>}
      </div>
    </div>
  )
}

/** Titles of documents by id, fetched once each */
export const useDocumentNames = (organizationId, projectId, ids) => {
  const [names, setNames] = useState({})
  const key = [...new Set(ids)].sort().join(',')

  useEffect(() => {
    const missing = key ? key.split(',').filter(id => !(id in names)) : []
    if (!missing.length || !organizationId || !projectId) return
    documentService
      .findDocumentsByCriteria(
        organizationId,
        projectId,
        { organizationId, projectId, documentInstanceIds: missing },
        getToken(),
        0,
        missing.length
      )
      .then(response => {
        const found = Object.fromEntries((response.data?.content ?? []).map(d => [d.id, d.title]))
        setNames(n => ({ ...n, ...Object.fromEntries(missing.map(id => [id, found[id] ?? 'A removed document'])) }))
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, organizationId, projectId])

  return names
}

const DocumentText = ({ documentId }) => {
  const [sections, setSections] = useState(null)

  useEffect(() => {
    setSections(null)
    documentService
      .getSectionsByDocumentId(documentId, getToken())
      .then(response => setSections(sortSections(response.data?.content ?? response.data ?? [])))
      .catch(() => setSections([]))
  }, [documentId])

  if (sections === null) {
    return (
      <div className='center' style={{ minHeight: 0, padding: 40 }}>
        <Spinner />
      </div>
    )
  }
  if (!sections.length) return <p className='faint sm'>Gendox hasn’t read any text from this file yet.</p>

  return sections.map(section => (
    <section key={section.id} className='sec'>
      {sectionTitleOf(section) && <h3>{sectionTitleOf(section)}</h3>}
      <Markdown text={section.sectionValue || ''} className='prose' />
    </section>
  ))
}

/**
 * The inspector beside the insights table: one answer, one document, one question, or new questions.
 * @param view - { kind: 'answer' | 'doc' | 'q' | 'new', docId, qId, tab }
 * @param ctx - the page's data and actions (see the Document insights page)
 */
const InsightsInspector = ({ view, ctx }) => {
  const { docs, questions, answerOf, full, toggleFull, open, close, step, ask, generate, running, href } = ctx
  const doc = docs.find(d => d.id === view.docId)
  const question = questions.find(q => q.id === view.qId)
  const answer = doc && question ? answerOf(doc.id, question.id) : null

  const head = (kind, title, sub, nav) => (
    <header className='insp-h'>
      <IconButton icon={ArrowLeft} title='Back to the table' onClick={close} data-narrow='' />
      <div className='insp-t'>
        <div className='label' style={{ margin: 0 }}>
          {kind}
        </div>
        <div className='t'>{title}</div>
        {sub && <div className='faint sm trunc'>{sub}</div>}
      </div>
      <div className='insp-nav'>
        {nav?.includes('v') && (
          <>
            <IconButton icon={ChevronUp} title='Previous document (↑)' onClick={() => step(-1, 0)} />
            <IconButton icon={ChevronDown} title='Next document (↓)' onClick={() => step(1, 0)} />
          </>
        )}
        {nav?.includes('h') && (
          <>
            <IconButton icon={ChevronLeft} title='Previous question (←)' onClick={() => step(0, -1)} />
            <IconButton icon={ChevronRight} title='Next question (→)' onClick={() => step(0, 1)} />
          </>
        )}
      </div>
      <IconButton
        icon={full ? PanelLeftOpen : Maximize2}
        title={full ? 'Show the table' : 'Use the whole width'}
        onClick={toggleFull}
        data-wide=''
      />
      <IconButton icon={X} title='Close (Esc)' onClick={close} data-wide='' />
    </header>
  )

  if (view.kind === 'answer') {
    if (!doc || !question) return null
    if (!answer) {
      return (
        <>
          {head('Answer', questionLabel(question), `in ${doc.name}`, 'vh')}
          <div className='insp-b'>
            <Empty
              icon={<CircleDashed className='lucide' />}
              title='Not answered yet'
              text={running ? 'It’s being generated.' : 'Generate this answer to see it here.'}
              action={
                !running && (
                  <button
                    className='btn primary'
                    onClick={() => generate({ documentNodeIds: [doc.id], questionNodeIds: [question.id], reGenerateExistingAnswers: true })}
                  >
                    <Sparkles className='lucide' />
                    Generate
                  </button>
                )
              }
            />
          </div>
        </>
      )
    }

    return (
      <>
        {head(
          'Answer',
          <button className='linkbtn' onClick={() => open({ kind: 'q', qId: question.id, tab: 'setup' })}>
            {questionLabel(question)}
          </button>,
          <>
            in{' '}
            <button className='linkbtn' onClick={() => open({ kind: 'doc', docId: doc.id })}>
              {doc.name}
            </button>
          </>,
          'vh'
        )}
        <div className='insp-b'>
          <div className='insp-cols'>
            <article className='read'>
              <div className='ans-v'>
                <Flag flag={answer.flag} />
                <div>
                  <div className='v'>{answer.value || <span className='faint'>No short answer</span>}</div>
                  <div className='faint sm'>
                    {flagText(answer.flag)}
                    {answer.decision?.kind === 'CHOICE' && answer.decision.selectedValue && (
                      <>
                        {' '}
                        · stored as <code>{answer.decision.selectedValue}</code>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {answer.decision ? (
                <DecisionResult question={question} answer={answer} />
              ) : (
                <>
                  <div className='label' style={{ marginTop: 8 }}>
                    Explanation
                  </div>
                  {answer.message ? (
                    <Markdown text={answer.message} className='prose reading' />
                  ) : (
                    <p className='faint'>No explanation was written.</p>
                  )}
                </>
              )}
            </article>
            <aside className='facts'>
              <div className='fact-block'>
                <div className='label'>Question</div>
                <p>{question.text}</p>
                <div className='row' style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className='badge'>{KIND[kindOf(question)]}</span>
                  <button className='linkbtn sm' onClick={() => open({ kind: 'q', qId: question.id, tab: 'answers' })}>
                    All its answers
                  </button>
                </div>
              </div>
              <div className='fact-block'>
                <div className='label'>Document</div>
                <div className='trunc'>{doc.name}</div>
                {doc.prompt && <p className='faint sm' style={{ marginTop: 8 }}>Has its own instructions</p>}
                <div className='row' style={{ gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <Link className='btn s' href={href('/gendox/document-instance', { documentId: doc.documentId })}>
                    <FileText className='lucide' />
                    Open document
                  </Link>
                  <button className='btn ghost s' onClick={() => open({ kind: 'doc', docId: doc.id, tab: 'answers' })}>
                    All its answers
                  </button>
                </div>
              </div>
              {answer.updatedAt && (
                <div className='fact-block'>
                  <div className='label'>Generated</div>
                  <p className='muted sm'>{formatDateTime(answer.updatedAt)}</p>
                </div>
              )}
            </aside>
          </div>
        </div>
        <footer className='insp-f'>
          <button
            className='btn s'
            disabled={running}
            onClick={() =>
              ask({
                title: 'Generate this answer again?',
                text: `The answer to “${questionLabel(question)}” for ${doc.name} is replaced.`,
                label: 'Generate again',
                danger: false,
                onOk: () => generate({ documentNodeIds: [doc.id], questionNodeIds: [question.id], reGenerateExistingAnswers: true })
              })
            }
          >
            <RefreshCw className='lucide' />
            Generate again
          </button>
          <button
            className='btn ghost s'
            onClick={() => copyToClipboard(answer.decision ? answer.value : answer.message || answer.value).then(() => toast.success('Answer copied'))}
          >
            <Copy className='lucide' />
            Copy
          </button>
          <span className='sp' />
          <span className='faint sm hide-i'>↑ ↓ ← → move between answers</span>
        </footer>
      </>
    )
  }

  if (view.kind === 'doc') return doc ? <DocumentPane view={view} doc={doc} ctx={ctx} head={head} /> : null
  if (view.kind === 'q') return question ? <QuestionPane view={view} question={question} ctx={ctx} head={head} /> : null
  if (view.kind === 'new') return <NewQuestionsPane ctx={ctx} head={head} />

  return null
}

const docTabOf = (doc, answered) => (doc.summary?.answerText || doc.summary?.answerValue ? 'summary' : answered ? 'answers' : 'setup')

const DocumentPane = ({ view, doc, ctx, head }) => {
  const { questions, answerOf, open, ask, generate, running, href, organizationId, projectId, taskId, reload, pickDocuments, names } = ctx
  const answers = questions.map(q => [q, answerOf(doc.id, q.id)])
  const answered = answers.filter(([, a]) => a).length
  const hasSummary = !!(doc.summary?.answerText || doc.summary?.answerValue)
  const tab = view.tab ?? docTabOf(doc, answered)
  const [prompt, setPrompt] = useState(doc.prompt)
  const [support, setSupport] = useState(doc.supportingDocumentIds)
  const [saving, setSaving] = useState(false)
  const [foldAll, setFoldAll] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setPrompt(doc.prompt)
    setSupport(doc.supportingDocumentIds)
  }, [doc])

  const setTab = t => open({ kind: 'doc', docId: doc.id, tab: t })
  const dirty = prompt !== doc.prompt || JSON.stringify(support) !== JSON.stringify(doc.supportingDocumentIds)

  const save = async () => {
    setSaving(true)
    try {
      await taskService.updateTaskNode(
        organizationId,
        projectId,
        taskId,
        {
          id: doc.id,
          taskId,
          nodeType: 'DOCUMENT',
          nodeValue: { documentMetadata: { prompt, supportingDocumentIds: support } }
        },
        getToken()
      )
      toast.success('Saved')
      await reload()
      setTab(answered ? 'answers' : 'setup')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const { downloadBlobForCSV } = await import('src/utils/tasks/downloadBlobForCSV')
      const blob = await taskService.documentInsightsExportCSV(organizationId, projectId, taskId, doc.id, getToken())
      downloadBlobForCSV(blob, `${doc.name.replace(/\s+/g, '_')}.csv`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setExporting(false)
    }
  }

  const counts = Object.keys(FLAGS)
    .map(flag => [flag, answers.filter(([, a]) => a?.flag === flag).length])
    .filter(([, n]) => n)

  return (
    <>
      {head(
        'Document',
        doc.name,
        `${answered} of ${plural(questions.length, 'question')} answered${doc.prompt ? ' · has its own instructions' : ''}`,
        'v'
      )}
      <Tabs
        current={tab}
        onChange={setTab}
        tabs={[
          ...(hasSummary ? [['summary', 'Summary']] : []),
          ['answers', 'Answers', answered],
          ['setup', 'Instructions and sources'],
          ['text', 'Text']
        ]}
      />
      <div className='insp-b'>
        {tab === 'summary' && hasSummary ? (
          <article className='read reading-w'>
            <div className='ans-v'>
              <Flag flag={doc.summary.answerFlagEnum} />
              <div>
                <div className='v'>{doc.summary.answerValue || 'Summary'}</div>
                <div className='faint sm'>
                  Summary of the {plural(answered, 'answer')} · {flagText(doc.summary.answerFlagEnum)}
                </div>
              </div>
            </div>
            {doc.summary.answerText && <Markdown text={doc.summary.answerText} className='prose reading' />}
          </article>
        ) : tab === 'setup' ? (
          <div className='form reading-w'>
            <fieldset className='lock' disabled={saving}>
            <div className='field'>
              <label htmlFor='doc-prompt'>Instructions for this document</label>
              <textarea
                id='doc-prompt'
                className='input'
                rows={6}
                value={prompt}
                placeholder='e.g. Acme is the customer in this agreement. Ignore Annex C, it was replaced.'
                onChange={e => setPrompt(e.target.value)}
              />
              <span className='help'>Added to every question, for this document only. Use it for what the AI can’t know from the file.</span>
            </div>
            <div className='field'>
              <span className='lab'>Supporting documents</span>
              <span className='help' style={{ margin: '0 0 6px' }}>
                Read together with this document, e.g. the master agreement an order form refers to.
              </span>
              <SupportingList
                ids={support}
                names={names}
                onRemove={id => setSupport(s => s.filter(x => x !== id))}
                onAdd={() =>
                  pickDocuments({
                    title: 'Supporting documents',
                    subtitle: `Read together with ${doc.name} when answering.`,
                    okLabel: 'Use these',
                    initial: support,
                    onPick: async ids => setSupport(ids)
                  })
                }
              />
            </div>
            {answered > 0 && dirty && (
              <div className='alert' style={{ '--c': 'var(--warn)' }}>
                <b>
                  <TriangleAlert className='lucide' />
                  Saving deletes this document’s {plural(answered, 'answer')}
                </b>
                <span className='muted'>Generate them again afterwards so they follow the new instructions.</span>
              </div>
            )}
            <div className='row'>
              <button
                aria-busy={saving}
                className='btn primary'
                disabled={!dirty || saving}
                onClick={() =>
                  answered
                    ? ask({
                        title: 'Save and delete this document’s answers?',
                        text: `Its ${plural(answered, 'answer')} are deleted. Generate them again to follow the new instructions.`,
                        label: 'Save',
                        onOk: save
                      })
                    : save()
                }
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                className='btn ghost'
                disabled={!dirty}
                onClick={() => {
                  setPrompt(doc.prompt)
                  setSupport(doc.supportingDocumentIds)
                }}
              >
                Discard changes
              </button>
            </div>
            </fieldset>
          </div>
        ) : tab === 'text' ? (
          <div className='read reading-w'>
            <p className='faint sm' style={{ marginBottom: 16 }}>
              The text Gendox read from the file, which every answer is based on.{' '}
              <Link className='link' href={href('/gendox/document-instance', { documentId: doc.documentId })}>
                Open in Knowledge
              </Link>
            </p>
            <DocumentText documentId={doc.documentId} />
          </div>
        ) : (
          <div className='insp-cols'>
            <article className='read'>
              {answered ? (
                <>
                  <div className='row' style={{ margin: '6px 0 10px' }}>
                    <span className='label' style={{ margin: 0, flex: 1 }}>
                      {plural(answered, 'answer')}
                    </span>
                    <button className='linkbtn sm' onClick={() => setFoldAll(f => !f)}>
                      {foldAll ? 'Expand all' : 'Collapse all'}
                    </button>
                  </div>
                  {answers.map(([q, a]) =>
                    a ? (
                      <details key={`${q.id}-${foldAll}`} className='qa' open={!foldAll}>
                        <summary>
                          <Flag flag={a.flag} />
                          <b>{questionLabel(q)}</b>
                          <span className='v'>{a.value}</span>
                          <ChevronDown className='lucide' />
                        </summary>
                        <div className='qa-b'>
                          <p className='faint sm'>{q.text}</p>
                          {a.decision ? (
                            <p className='muted sm'>
                              {KIND[kindOf(q)]}
                              {a.decision.probability != null && ` · probability ${percent(a.decision.probability)}%`}
                              {a.decision.kind === 'CHOICE' && a.decision.selectedValue && (
                                <>
                                  {' '}
                                  · <code>{a.decision.selectedValue}</code>
                                </>
                              )}
                            </p>
                          ) : (
                            a.message && <Markdown text={a.message} className='prose' />
                          )}
                          <button className='linkbtn sm' onClick={() => open({ kind: 'answer', docId: doc.id, qId: q.id })}>
                            Open this answer <ArrowRight className='lucide' style={{ width: 13, height: 13, verticalAlign: '-2px' }} />
                          </button>
                        </div>
                      </details>
                    ) : null
                  )}
                </>
              ) : (
                <Empty
                  icon={<Sparkles className='lucide' />}
                  title='No answers yet'
                  text={questions.length ? `Generate the ${plural(questions.length, 'answer')} for this document.` : 'Add questions first.'}
                />
              )}
            </article>
            <aside className='facts'>
              <div className='fact-block'>
                <div className='label'>Answers</div>
                {counts.length ? (
                  <div className='stack' style={{ gap: 6 }}>
                    {counts.map(([flag, n]) => (
                      <div key={flag} className='row sm'>
                        <Flag flag={flag} />
                        <span style={{ flex: 1 }}>{FLAGS[flag].text}</span>
                        <span className='num faint'>{n}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='faint sm'>None yet</p>
                )}
              </div>
              <div className='fact-block'>
                <div className='label'>Instructions for this document</div>
                {doc.prompt ? <p className='sm'>{doc.prompt}</p> : <p className='faint sm'>None. The questions are used as they are.</p>}
                <div className='label' style={{ marginTop: 14 }}>
                  Supporting documents
                </div>
                {doc.supportingDocumentIds.length ? (
                  doc.supportingDocumentIds.map(id => (
                    <div key={id} className='sm trunc' style={{ marginBottom: 4 }}>
                      {names[id] ?? '…'}
                    </div>
                  ))
                ) : (
                  <p className='faint sm'>None</p>
                )}
                <button className='linkbtn sm' style={{ marginTop: 8 }} onClick={() => setTab('setup')}>
                  <Pencil className='lucide' style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> Edit
                </button>
              </div>
              <div className='fact-block'>
                <div className='label'>File</div>
                <Link className='btn s' href={href('/gendox/document-instance', { documentId: doc.documentId })}>
                  <FileText className='lucide' />
                  Open document
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>
      <footer className='insp-f'>
        <button
          className='btn s primary'
          disabled={running || !questions.length}
          onClick={() =>
            ask({
              title: `Generate answers for ${doc.name}?`,
              text: answered
                ? `Its ${plural(answered, 'answer')} are replaced${answered < questions.length ? ' and the missing ones written' : ''}.`
                : `${plural(questions.length, 'answer')} will be written.`,
              label: 'Generate',
              danger: false,
              onOk: () => generate({ documentNodeIds: [doc.id], questionNodeIds: [], reGenerateExistingAnswers: true })
            })
          }
        >
          <Sparkles className='lucide' />
          {answered ? 'Generate again' : 'Generate answers'}
        </button>
        <button className='btn s' onClick={exportCsv} disabled={exporting || !answered}>
          <Download className='lucide' />
          CSV
        </button>
        <span className='sp' />
        <button
          className='btn ghost s danger'
          onClick={() =>
            ask({
              title: 'Remove from task?',
              text: `${doc.name} and its answers are removed from this task. The document stays in the knowledge.`,
              label: 'Remove',
              onOk: async () => {
                try {
                  await taskService.deleteTaskNode(organizationId, projectId, doc.id, getToken())
                  ctx.close()
                  toast.success('Removed from the task')
                  reload()
                } catch (error) {
                  toast.error(getErrorMessage(error))
                }
              }
            })
          }
        >
          <X className='lucide' />
          Remove from task
        </button>
      </footer>
    </>
  )
}

const QuestionPane = ({ view, question, ctx, head }) => {
  const { docs, questions, answerOf, open, ask, generate, running, organizationId, projectId, taskId, reload, pickDocuments, names, moveQuestion, total } =
    ctx
  const tab = view.tab ?? 'setup'
  const index = questions.indexOf(question)
  const decision = isDecision(question)
  const [form, setForm] = useState(() => questionForm(question))
  const [filter, setFilter] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(questionForm(question))
    setFilter(null)
  }, [question])

  const rows = docs.map(d => [d, answerOf(d.id, question.id)])
  const answered = rows.filter(([, a]) => a)
  const bucketOf = a => (decision ? a.value : a.flag)
  const buckets = useMemo(() => {
    const map = new Map()
    answered.forEach(([, a]) => map.set(bucketOf(a), (map.get(bucketOf(a)) ?? 0) + 1))

    return [...map]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered.length, question.id, docs])
  const changed = questionChanged(question, form)
  const dirty = changed || form.title !== question.title
  const problem = questionProblem(form)

  const save = async () => {
    setSaving(true)
    try {
      await taskService.updateTaskNode(
        organizationId,
        projectId,
        taskId,
        {
          id: question.id,
          taskId,
          nodeType: 'QUESTION',
          nodeValue: {
            message: form.text,
            questionTitle: form.title,
            order: question.order,
            insightConfig: insightConfigOf(form),
            documentMetadata: { supportingDocumentIds: form.supportingDocumentIds }
          }
        },
        getToken()
      )
      toast.success('Question saved')
      reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {head(
        `Question · column ${index + 1} of ${questions.length}`,
        questionLabel(question),
        `${KIND[kindOf(question)]} · ${answered.length} of ${docs.length} shown answered`,
        'h'
      )}
      <Tabs
        current={tab}
        onChange={t => open({ kind: 'q', qId: question.id, tab: t })}
        tabs={[
          ['setup', 'Setup'],
          ['answers', 'Answers', answered.length]
        ]}
      />
      <div className='insp-b'>
        {tab === 'answers' ? (
          <div className='read reading-w'>
            <p className='q-text'>{question.text}</p>
            <div className='dist'>
              {buckets.map(([key, n]) => (
                <button key={key} className={`chip ${filter === key ? 'on' : ''}`} onClick={() => setFilter(f => (f === key ? null : key))}>
                  {!decision && <Flag flag={key} />}
                  {decision ? key || 'No value' : flagText(key)}
                  <span className='faint num'>{n}</span>
                </button>
              ))}
              {rows.length > answered.length && (
                <span className='chip' style={{ cursor: 'default' }}>
                  <CircleDashed className='lucide' />
                  Not answered
                  <span className='faint num'>{rows.length - answered.length}</span>
                </span>
              )}
            </div>
            {answered.length > 0 ? (
              <div className='qlist'>
                {answered
                  .filter(([, a]) => filter == null || bucketOf(a) === filter)
                  .map(([d, a]) => (
                    <button key={d.id} className='qrow' onClick={() => open({ kind: 'answer', docId: d.id, qId: question.id })}>
                      <Flag flag={a.flag} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className='row' style={{ gap: 8 }}>
                          <b className='v'>{a.value || '—'}</b>
                          {a.decision?.probability != null && <span className='faint sm num'>{percent(a.decision.probability)}%</span>}
                          <span className='sp' />
                          <span className='faint sm trunc' style={{ maxWidth: '45%' }}>
                            {d.name}
                          </span>
                        </div>
                        {!a.decision && a.message && (
                          <div className='muted sm clamp2'>{a.message.replace(/[#*>|`_]/g, '').replace(/\n+/g, ' ').slice(0, 260)}</div>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            ) : (
              <p className='faint sm'>No answers among the documents shown.</p>
            )}
            {total > docs.length && (
              <p className='faint sm' style={{ marginTop: 12 }}>
                Showing the {docs.length} documents on this page of the table.
              </p>
            )}
          </div>
        ) : (
          <div className='form reading-w'>
            <fieldset className='lock' disabled={saving}>
            <QuestionForm
              form={form}
              onChange={setForm}
              names={names}
              idPrefix={`q-${question.id}`}
              onPickSupport={() =>
                pickDocuments({
                  title: 'Supporting documents',
                  subtitle: 'Read together with every document when answering this question.',
                  okLabel: 'Use these',
                  initial: form.supportingDocumentIds,
                  onPick: async ids => setForm(f => ({ ...f, supportingDocumentIds: ids }))
                })
              }
            />
            {changed && answered.length > 0 && (
              <div className='alert' style={{ '--c': 'var(--warn)' }}>
                <b>
                  <TriangleAlert className='lucide' />
                  Saving deletes this column’s answers
                </b>
                <span className='muted'>
                  Changing the question, how it’s answered or its supporting documents. Generate them again afterwards.
                </span>
              </div>
            )}
            <div className='row'>
              <button
                aria-busy={saving}
                className='btn primary'
                disabled={!dirty || !!problem || saving}
                title={problem ?? undefined}
                onClick={() =>
                  changed && answered.length
                    ? ask({
                        title: 'Save and delete this column’s answers?',
                        text: 'Its answers are deleted. Generate them again afterwards.',
                        label: 'Save',
                        onOk: save
                      })
                    : save()
                }
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className='btn ghost' disabled={!dirty} onClick={() => setForm(questionForm(question))}>
                Discard changes
              </button>
              {dirty && problem && <span className='sm' style={{ color: 'var(--err)' }}>{problem}</span>}
            </div>
            </fieldset>
          </div>
        )}
      </div>
      <footer className='insp-f'>
        <button
          className='btn s primary'
          disabled={running || !docs.length}
          onClick={() =>
            ask({
              title: `Generate “${questionLabel(question)}”?`,
              text: 'Empty cells in this column are filled. Existing answers are kept.',
              label: 'Generate',
              danger: false,
              onOk: () => generate({ documentNodeIds: [], questionNodeIds: [question.id], reGenerateExistingAnswers: false })
            })
          }
        >
          <Sparkles className='lucide' />
          Generate missing
        </button>
        <button className='btn s' disabled={index <= 0} onClick={() => moveQuestion(question.id, -1)}>
          <ArrowLeft className='lucide' />
          Move left
        </button>
        <button className='btn s' disabled={index >= questions.length - 1} onClick={() => moveQuestion(question.id, 1)}>
          Move right
          <ArrowRight className='lucide' />
        </button>
        <span className='sp' />
        <button
          className='btn ghost s danger'
          onClick={() =>
            ask({
              title: `Delete “${questionLabel(question)}”?`,
              text: 'The column and its answers are deleted.',
              onOk: async () => {
                try {
                  await taskService.deleteTaskNode(organizationId, projectId, question.id, getToken())
                  ctx.close()
                  toast.success('Column deleted')
                  reload()
                } catch (error) {
                  toast.error(getErrorMessage(error))
                }
              }
            })
          }
        >
          <Trash2 className='lucide' />
          Delete
        </button>
      </footer>
    </>
  )
}

const NewQuestionsPane = ({ ctx, head }) => {
  const { questions, organizationId, projectId, taskId, reload, close } = ctx
  const [forms, setForms] = useState(() => [questionForm(null)])
  const [saving, setSaving] = useState(false)
  const filled = forms.filter(f => f.text.trim() || f.title.trim())
  const problem = filled.map(questionProblem).find(Boolean)

  const add = async () => {
    if (!filled.length || problem) return
    setSaving(true)
    try {
      const payloads = filled.map((form, i) => ({
        taskId,
        nodeType: 'QUESTION',
        nodeValue: {
          message: form.text,
          questionTitle: form.title,
          order: questions.length + i,
          insightConfig: insightConfigOf(form)
        }
      }))
      for (let i = 0; i < payloads.length; i += 10) {
        await taskService.createTaskNodesBatch(organizationId, projectId, payloads.slice(i, i + 10), getToken())
      }
      toast.success(filled.length === 1 ? 'Question added. Generate missing answers to fill the column.' : `${filled.length} questions added`)
      close()
      reload()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {head('New questions', 'Add questions', 'Each question becomes a column. The AI answers it for every document.')}
      <div className='insp-b'>
        <div className='form reading-w'>
          <fieldset className='lock' disabled={saving}>
          {forms.map((form, i) => (
            <div key={i} className={forms.length > 1 ? 'fact-block' : ''} style={forms.length > 1 ? { background: 'none' } : undefined}>
              {forms.length > 1 && (
                <div className='row' style={{ marginBottom: 10 }}>
                  <span className='label' style={{ margin: 0, flex: 1 }}>
                    Question {i + 1}
                  </span>
                  <IconButton icon={X} title='Remove this question' onClick={() => setForms(fs => fs.filter((_, j) => j !== i))} />
                </div>
              )}
              <QuestionForm form={form} idPrefix={`new-${i}`} onChange={next => setForms(fs => fs.map((f, j) => (j === i ? next : f)))} />
            </div>
          ))}
          <button className='btn ghost s' style={{ alignSelf: 'flex-start' }} onClick={() => setForms(fs => [...fs, questionForm(null)])}>
            <Plus className='lucide' />
            Another question
          </button>
          <p className='faint sm'>Supporting documents can be added to a question once it’s saved.</p>
          <div className='row'>
            <button aria-busy={saving} className='btn primary' onClick={add} disabled={saving || !filled.length || !!problem}>
              {saving ? 'Adding…' : filled.length > 1 ? `Add ${filled.length} questions` : 'Add question'}
            </button>
            <button className='btn ghost' onClick={close}>
              Cancel
            </button>
            {filled.length > 0 && problem && <span className='sm' style={{ color: 'var(--err)' }}>{problem}</span>}
          </div>
          </fieldset>
        </div>
      </div>
    </>
  )
}

export { docTabOf }
export default InsightsInspector
