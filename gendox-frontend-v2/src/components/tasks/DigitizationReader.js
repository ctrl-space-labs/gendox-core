import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Ban,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Copy,
  Download,
  FileText,
  Info,
  LoaderCircle,
  Maximize2,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Sparkles,
  X
} from 'lucide-react'
import taskService from 'src/gendox-sdk/taskService'
import { getErrorMessage } from 'src/utils/errorHandler'
import { copyToClipboard } from 'src/utils/copyToClipboard'
import { downloadBlobForCSV } from 'src/utils/tasks/downloadBlobForCSV'
import { getToken } from 'src/components/agent/useAgent'
import Markdown from 'src/components/chat/Markdown'
import Empty from 'src/components/ui/Empty'
import Menu from 'src/components/ui/Menu'
import Spinner from 'src/components/ui/Spinner'
import { plural } from 'src/components/knowledge/documentUtils'

const STEP = 8 // pages shown at a time
const ALL = 2147483647

const IconButton = ({ icon: Icon, title, onClick, disabled, ...rest }) => (
  <button className='btn ghost s icon' title={title} aria-label={title} onClick={onClick} disabled={disabled} {...rest}>
    <Icon className='lucide' />
  </button>
)

const parseJson = text => {
  const t = (text || '').trim().replace(/^```(?:json)?\s*|\s*```$/g, '')
  if (!t.startsWith('{') && !t.startsWith('[')) return null
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// marks every match of `find` inside plain text
const Marked = ({ text, find }) => {
  if (!find) return text
  const parts = text.split(new RegExp(`(${escapeRe(find)})`, 'gi'))

  return parts.map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))
}

/** One digitized page: rendered Markdown or its source, or JSON formatted or raw */
const PageView = ({ n, text, state, format, find }) => {
  const json = useMemo(() => (text ? parseJson(text) : null), [text])

  return (
    <section className='pg' data-n={n}>
      <div className='pg-h'>
        <b>Page {n}</b>
        {state === 'done' && <span className='faint sm'>{json ? 'JSON' : 'Markdown'}</span>}
        <span className='sp' />
        {state === 'done' && (
          <IconButton
            icon={Copy}
            title='Copy this page'
            onClick={() => copyToClipboard(text).then(() => toast.success(`Page ${n} copied`))}
          />
        )}
      </div>
      {state === 'done' ? (
        json || format === 'source' || find ? (
          <pre className='code page-src'>
            <Marked text={json ? (format === 'source' ? JSON.stringify(json) : JSON.stringify(json, null, 2)) : text} find={find} />
          </pre>
        ) : (
          <Markdown text={text} className='prose reading' />
        )
      ) : state === 'running' ? (
        <div className='pg-empty'>
          <LoaderCircle className='lucide turning' />
          Digitizing this page…
        </div>
      ) : (
        <div className='pg-empty'>
          <CircleDashed className='lucide' />
          Not digitized yet.
        </div>
      )}
    </section>
  )
}

/** documentMetadata: prompt, structure and the page range. Pages already digitized keep their text. */
const Setup = ({ doc, ctx, onSaved }) => {
  const { organizationId, projectId, taskId, task } = ctx
  const [prompt, setPrompt] = useState(doc.prompt)
  const [structure, setStructure] = useState(doc.structure)
  const [all, setAll] = useState(doc.allPages || (!doc.pageFrom && !doc.pageTo))
  const [from, setFrom] = useState(doc.pageFrom ?? '')
  const [to, setTo] = useState(doc.pageTo ?? '')
  const [saving, setSaving] = useState(false)

  const range = all ? null : { from: from === '' ? null : Number(from), to: to === '' ? null : Number(to) }
  const problem =
    range &&
    ((range.from != null && range.from < 1) ||
      (range.to != null && range.to < 1) ||
      (range.from != null && range.to != null && range.from > range.to) ||
      (doc.pages && ((range.from ?? 1) > doc.pages || (range.to ?? 1) > doc.pages)))
      ? `Pick pages between 1 and ${doc.pages || 'the last'}, the first before the last.`
      : null
  const dirty =
    prompt !== doc.prompt ||
    structure !== doc.structure ||
    all !== (doc.allPages || (!doc.pageFrom && !doc.pageTo)) ||
    (!all && (String(from) !== String(doc.pageFrom ?? '') || String(to) !== String(doc.pageTo ?? '')))

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
          nodeValue: {
            documentMetadata: {
              prompt,
              structure,
              pageFrom: all ? null : range.from,
              pageTo: all ? null : range.to,
              allPages: all || (range.from == null && range.to == null)
            }
          }
        },
        getToken()
      )
      toast.success('Instructions saved')
      onSaved()
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setPrompt(doc.prompt)
    setStructure(doc.structure)
    setAll(doc.allPages || (!doc.pageFrom && !doc.pageTo))
    setFrom(doc.pageFrom ?? '')
    setTo(doc.pageTo ?? '')
  }

  return (
    <div className='insp-b'>
      <fieldset className='lock' disabled={saving}>
      <div className='form reading-w'>
        <div className='field'>
          <label htmlFor='dz-prompt'>Instructions</label>
          <textarea
            id='dz-prompt'
            className='input'
            rows={5}
            value={prompt}
            placeholder='e.g. Keep the invoice number and the VAT lines exactly as written.'
            onChange={e => setPrompt(e.target.value)}
          />
          <span className='help'>How to read each page of this document.</span>
        </div>
        <div className='field'>
          <label htmlFor='dz-structure'>Output structure</label>
          <textarea
            id='dz-structure'
            className='input mono'
            rows={8}
            value={structure}
            placeholder={'## Supplier\n## Lines\n| Item | Qty | Price |'}
            onChange={e => setStructure(e.target.value)}
          />
          <span className='help'>Markdown or JSON the AI fills in for every page. Leave it empty to keep the page’s own layout.</span>
        </div>
        <div className='field'>
          <span className='lab'>Pages</span>
          <div className='row' style={{ flexWrap: 'wrap', gap: 12 }}>
            <label className='check' style={{ alignItems: 'center' }}>
              <input type='radio' name={`pr-${doc.id}`} checked={all} onChange={() => setAll(true)} />
              <span>{doc.pages ? `All ${doc.pages} pages` : 'All pages'}</span>
            </label>
            <label className='check' style={{ alignItems: 'center' }}>
              <input type='radio' name={`pr-${doc.id}`} checked={!all} onChange={() => setAll(false)} />
              <span>Only</span>
            </label>
            <div className='affix' style={{ width: 110 }}>
              <span>from</span>
              <input
                className='input'
                type='number'
                min='1'
                value={from}
                disabled={all}
                aria-label='First page'
                onChange={e => setFrom(e.target.value)}
              />
            </div>
            <div className='affix' style={{ width: 110 }}>
              <span>to</span>
              <input
                className='input'
                type='number'
                min='1'
                value={to}
                disabled={all}
                aria-label='Last page'
                onChange={e => setTo(e.target.value)}
              />
            </div>
          </div>
          {problem && <span className='err'>{problem}</span>}
        </div>
        <div className='alert' style={{ '--c': 'var(--info)' }}>
          <b>
            <Info className='lucide' />
            Pages already digitized keep their text
          </b>
          <span className='muted'>
            Digitize again to apply new instructions to them. This task reads{' '}
            {task?.usePrintedPage && task?.usePageText
              ? 'an image of each page and the text in the file'
              : task?.usePageText
              ? 'the text in the file'
              : 'an image of each page'}{' '}
            (task settings).
          </span>
        </div>
        <div className='row'>
          <button aria-busy={saving} className='btn primary' onClick={save} disabled={saving || !dirty || !!problem}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button className='btn ghost' onClick={reset} disabled={!dirty}>
            Discard changes
          </button>
        </div>
      </div>
      </fieldset>
    </div>
  )
}

/**
 * The reader beside the documents: a page list, then the text of each page (ANSWER nodes of the document, `order` = page number).
 * @param doc - the selected document row
 * @param ctx - the page's data and actions (see the Digitization page)
 */
const DigitizationReader = ({ doc, tab, ctx }) => {
  const { organizationId, projectId, taskId, full, toggleFull, close, step, setTab, ask, generate, running, busy, href, reload } = ctx
  const [pages, setPages] = useState(null) // Map page number → text
  const [from, setFrom] = useState(1)
  const [format, setFormat] = useState('formatted')
  const [query, setQuery] = useState('')
  const [exporting, setExporting] = useState(false)
  const streamRef = useRef(null)
  const find = query.trim().length > 1 ? query.trim() : ''

  const loadPages = () =>
    taskService
      .getTaskNodesByCriteria(
        organizationId,
        projectId,
        taskId,
        { taskId, nodeTypeNames: ['ANSWER'], nodeValueNodeDocumentId: doc.id },
        getToken(),
        0,
        ALL
      )
      .then(response => {
        const map = new Map()
        ;(response.data?.content ?? []).forEach(node => map.set(node.nodeValue?.order || 0, node.nodeValue?.message || ''))
        setPages(map)
      })
      .catch(error => {
        toast.error(getErrorMessage(error))
        setPages(new Map())
      })

  useEffect(() => {
    setPages(null)
    setFrom(1)
    setQuery('')
    if (!doc.unsupported) loadPages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id])

  // while it is being digitized, pages appear as they are done
  useEffect(() => {
    if (busy && !doc.unsupported) loadPages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, doc.done])

  const last = Math.max(doc.pages || 0, ...(pages ? [...pages.keys()] : [0]))
  const stateOf = n => (pages?.has(n) ? 'done' : busy ? 'running' : 'missing')
  const shown = find
    ? [...(pages ?? new Map()).entries()]
        .filter(([, text]) => text.toLowerCase().includes(find.toLowerCase()))
        .map(([n]) => n)
        .sort((a, b) => a - b)
        .slice(0, 40)
    : Array.from({ length: Math.max(0, Math.min(STEP, last - from + 1)) }, (_, i) => from + i)
  const to = shown[shown.length - 1] ?? from

  const go = n => {
    setQuery('')
    setFrom(Math.min(Math.max(1, n), Math.max(1, last)))
    if (streamRef.current) streamRef.current.scrollTop = 0
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const blob = await taskService.documentDigitizationExportCSV(organizationId, projectId, taskId, doc.id, getToken())
      downloadBlobForCSV(blob, `${doc.name.replace(/\s+/g, '_')}.csv`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setExporting(false)
    }
  }

  const digitize = again =>
    ask(
      again
        ? {
            title: `Digitize ${doc.name} again?`,
            text: `${doc.pages ? `All ${doc.pages} pages are` : 'Every page is'} read again and their text replaced.`,
            label: 'Digitize again',
            onOk: () => generate({ documentNodeIds: [doc.id], reGenerateExistingAnswers: true })
          }
        : {
            title: doc.pages ? `Digitize ${plural(Math.max(0, doc.pages - doc.done), 'missing page')}?` : 'Digitize missing pages?',
            text: 'Pages already done are kept.',
            label: 'Digitize',
            danger: false,
            onOk: () => generate({ documentNodeIds: [doc.id], reGenerateExistingAnswers: false })
          }
    )

  const status = doc.unsupported
    ? ['', 'Can’t be digitized']
    : busy
    ? ['info', 'Digitizing']
    : doc.pages && doc.done >= doc.pages
    ? ['ok', 'Digitized']
    : doc.done
    ? ['warn', `${plural(doc.pages - doc.done, 'page')} missing`]
    : ['', 'Not digitized']

  return (
    <>
      <header className='insp-h'>
        <IconButton icon={ArrowLeft} title='Back to the documents' onClick={close} data-narrow='' />
        <div className='insp-t'>
          <div className='label' style={{ margin: 0 }}>
            Document
          </div>
          <div className='t trunc'>{doc.name}</div>
          <div className='row' style={{ gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            <span className={`badge dot ${status[0]}`}>{status[1]}</span>
            {doc.pages > 0 && (
              <span className='faint sm num'>
                {doc.done} of {doc.pages} pages
              </span>
            )}
          </div>
        </div>
        <div className='insp-nav'>
          <IconButton icon={ChevronUp} title='Previous document (↑)' onClick={() => step(-1)} />
          <IconButton icon={ChevronDown} title='Next document (↓)' onClick={() => step(1)} />
        </div>
        <IconButton
          icon={full ? PanelLeftOpen : Maximize2}
          title={full ? 'Show the documents' : 'Use the whole width'}
          onClick={toggleFull}
          data-wide=''
        />
        <IconButton icon={X} title='Close (Esc)' onClick={close} data-wide='' />
      </header>

      {doc.unsupported ? (
        <div className='insp-b'>
          <Empty
            icon={<Ban className='lucide' />}
            title='This format can’t be digitized'
            text='Digitization reads documents such as PDF, Word and spreadsheets. Save it as PDF and add it again.'
          />
        </div>
      ) : (
        <>
          <div className='tabs insp-tabs'>
            <button className={tab === 'result' ? 'on' : ''} onClick={() => setTab('result')}>
              Result<span className='n'>{doc.done}</span>
            </button>
            <button className={tab === 'setup' ? 'on' : ''} onClick={() => setTab('setup')}>
              Instructions
              {!doc.prompt && (
                <span className='badge warn' style={{ height: 18, marginLeft: 6 }}>
                  None
                </span>
              )}
            </button>
          </div>

          {tab === 'setup' ? (
            <Setup key={doc.id} doc={doc} ctx={ctx} onSaved={reload} />
          ) : (
            <>
              <div className='rd-tools'>
                <div className='row' style={{ gap: 4 }}>
                  <span className='faint sm'>Page</span>
                  <input
                    className='input s num'
                    type='number'
                    min='1'
                    max={last || 1}
                    value={from}
                    style={{ width: 72 }}
                    aria-label='Go to page'
                    onChange={e => go(Number(e.target.value) || 1)}
                  />
                  <span className='faint sm'>of {last || '—'}</span>
                </div>
                <div className='pill-tabs'>
                  <button className={format === 'formatted' ? 'on' : ''} onClick={() => setFormat('formatted')}>
                    Rendered
                  </button>
                  <button className={format === 'source' ? 'on' : ''} onClick={() => setFormat('source')}>
                    Source
                  </button>
                </div>
                <label className='search'>
                  <Search className='lucide' />
                  <input placeholder='Find in the result' value={query} onChange={e => setQuery(e.target.value)} />
                </label>
              </div>
              <div className='rd-b'>
                <nav className='pg-rail' aria-label='Pages'>
                  {Array.from({ length: last }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      className={`${stateOf(n)} ${!find && n >= from && n <= to ? 'in' : ''}`}
                      title={`Page ${n}: ${stateOf(n) === 'done' ? 'digitized' : stateOf(n) === 'running' ? 'digitizing' : 'not digitized'}`}
                      onClick={() => go(n)}
                    >
                      {n}
                    </button>
                  ))}
                </nav>
                <div className='pg-stream scroller' ref={streamRef}>
                  {pages === null ? (
                    <div className='center' style={{ minHeight: 0, padding: 40 }}>
                      <Spinner />
                    </div>
                  ) : !last ? (
                    <Empty
                      icon={<Sparkles className='lucide' />}
                      title='Not digitized yet'
                      text={doc.prompt ? 'Digitize it to read its pages here.' : 'Add instructions first, or digitize it as it is.'}
                    />
                  ) : (
                    <>
                      {find ? (
                        <p className='faint sm' style={{ margin: '14px 0 12px' }}>
                          {shown.length ? `“${find}” on ${plural(shown.length, 'page')}` : `“${find}” isn’t on any digitized page`}
                        </p>
                      ) : (
                        from > 1 && (
                          <button className='btn ghost s more' onClick={() => go(from - STEP)}>
                            <ChevronUp className='lucide' />
                            Pages {Math.max(1, from - STEP)}–{from - 1}
                          </button>
                        )
                      )}
                      {shown.map(n => (
                        <PageView key={n} n={n} text={pages.get(n)} state={stateOf(n)} format={format} find={find} />
                      ))}
                      {!find && to < last && (
                        <button className='btn s more' onClick={() => go(to + 1)}>
                          <ChevronDown className='lucide' />
                          Next {Math.min(STEP, last - to)} pages <span className='faint'>· {last - to} more</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          <footer className='insp-f'>
            <div className='split-btn'>
              <button className='btn s primary' disabled={running} onClick={() => digitize(doc.pages && doc.done >= doc.pages)}>
                <Sparkles className='lucide' />
                {doc.pages && doc.done >= doc.pages ? 'Digitize again' : 'Digitize missing pages'}
              </button>
              <Menu
                align='right'
                up
                width={260}
                trigger={({ onClick }) => (
                  <button className='btn s primary' onClick={onClick} disabled={running} title='More ways to digitize'>
                    <ChevronDown className='lucide' />
                  </button>
                )}
              >
                <button className='mi' data-close-menu onClick={() => digitize(false)}>
                  <Sparkles className='lucide' />
                  Digitize missing pages
                </button>
                <button className='mi' data-close-menu onClick={() => digitize(true)}>
                  <RefreshCw className='lucide' />
                  Digitize every page again
                </button>
              </Menu>
            </div>
            <button className='btn s' title='Export this document’s pages as CSV' onClick={exportCsv} disabled={exporting || !doc.done}>
              <Download className='lucide' />
              CSV
            </button>
            <Link className='btn ghost s' href={href('/gendox/document-instance', { documentId: doc.documentId })}>
              <FileText className='lucide' />
              <span className='hide-i'>Open in Knowledge</span>
            </Link>
            <span className='sp' />
            <button
              className='btn ghost s danger'
              title='Remove from task'
              onClick={() =>
                ask({
                  title: 'Remove from task?',
                  text: `${doc.name} and its digitized pages are removed from this task. The document stays in the knowledge.`,
                  label: 'Remove',
                  onOk: async () => {
                    try {
                      await taskService.deleteTaskNode(organizationId, projectId, doc.id, getToken())
                      close()
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
              <span className='hide-i'>Remove from task</span>
            </button>
          </footer>
        </>
      )}
    </>
  )
}

export default DigitizationReader
