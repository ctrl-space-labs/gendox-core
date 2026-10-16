import { Fragment, memo, useMemo, useState } from 'react'
import Link from 'next/link'
import { diffWords } from 'diff'
import { ArrowLeft, ChevronDown, FileText, Play } from 'lucide-react'
import documentService from 'src/gendox-sdk/documentService'
import { getErrorMessage } from 'src/utils/errorHandler'
import useAgent, { getToken } from 'src/components/agent/useAgent'
import AppLayout from 'src/layouts/AppLayout'
import DocumentPicker from 'src/components/tasks/DocumentPicker'
import Markdown from 'src/components/chat/Markdown'
import Spinner from 'src/components/ui/Spinner'

/**
 * Parse the decoded unified diff from …/documents/diff into aligned side-by-side rows.
 *
 * The backend URL-decodes the patch, so a %0A inside one diff operation becomes a real newline: a line without a
 * '-', '+' or ' ' prefix continues the previous operation. Pass 1 joins those back onto their operation, pass 2 splits
 * every operation into one row per line, pass 3 pairs deleted with inserted lines.
 *
 * Row kinds: hunk (the @@ header), context, inline-change (a deleted and an inserted line with word highlights),
 * change (a deleted or an inserted line on its own).
 */
const parsePatchTextToRows = patchText => {
  const rawLines = String(patchText || '').replace(/\r\n/g, '\n').split('\n')

  const ops = []
  let cur = null
  for (const rawLine of rawLines) {
    if (rawLine.startsWith('@@')) {
      if (cur) ops.push(cur)
      cur = null
      ops.push({ op: '@@', text: rawLine })
      continue
    }
    if (rawLine.startsWith('---') || rawLine.startsWith('+++') || rawLine.startsWith('\\ No newline')) {
      if (cur) ops.push(cur)
      cur = null
      continue
    }
    const prefix = rawLine[0]
    if (prefix === '-' || prefix === '+' || prefix === ' ') {
      if (cur) ops.push(cur)
      cur = { op: prefix, text: rawLine.slice(1) }
    } else if (cur) {
      cur.text += '\n' + rawLine
    } else {
      cur = { op: ' ', text: rawLine }
    }
  }
  if (cur) ops.push(cur)

  const items = ops.flatMap(op => (op.op === '@@' ? [op] : op.text.split('\n').map(text => ({ op: op.op, text }))))

  const rows = []
  let pendingDel = []
  let pendingIns = []
  let leftLine = 0
  let rightLine = 0
  let delStart = 0
  let insStart = 0

  const flushChange = () => {
    const len = Math.max(pendingDel.length, pendingIns.length)
    for (let i = 0; i < len; i++) {
      const del = i < pendingDel.length ? pendingDel[i] : null
      const ins = i < pendingIns.length ? pendingIns[i] : null
      if (del !== null && ins !== null) {
        rows.push({ kind: 'inline-change', leftLineNum: delStart + i, rightLineNum: insStart + i, parts: diffWords(del, ins) })
      } else if (del !== null) {
        rows.push({ kind: 'change', left: { text: del, kind: 'delete', lineNum: delStart + i }, right: { text: '', kind: 'empty' } })
      } else {
        rows.push({ kind: 'change', left: { text: '', kind: 'empty' }, right: { text: ins, kind: 'insert', lineNum: insStart + i } })
      }
    }
    pendingDel = []
    pendingIns = []
  }

  for (const item of items) {
    if (item.op === '@@') {
      flushChange()
      const m = item.text.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/)
      if (m) {
        leftLine = +m[1]
        rightLine = +m[2]
      }
      rows.push({ kind: 'hunk', header: item.text })
    } else if (item.op === '-') {
      if (!pendingDel.length) delStart = leftLine
      pendingDel.push(item.text)
      leftLine++
    } else if (item.op === '+') {
      if (!pendingIns.length) insStart = rightLine
      pendingIns.push(item.text)
      rightLine++
    } else {
      flushChange()
      rows.push({
        kind: 'context',
        left: { text: item.text, kind: 'context', lineNum: leftLine++ },
        right: { text: item.text, kind: 'context', lineNum: rightLine++ }
      })
    }
  }
  flushChange()

  return rows
}

// a whole line: unchanged, or deleted / inserted with nothing opposite it
const DiffCell = memo(function DiffCell({ cell, markdown, left }) {
  return (
    <div className={`vd-cell ${cell.kind} ${left ? 'left' : ''}`}>
      <span className='vd-n'>{cell.lineNum ?? ''}</span>
      {markdown && cell.kind === 'context' ? (
        <div className='vd-t vd-md'>
          <Markdown text={cell.text || ''} className='' />
        </div>
      ) : (
        <span className='vd-t'>{cell.text || '​'}</span>
      )}
    </div>
  )
})

// a changed line, with the words that changed marked. Always plain text: markdown would lose the word marks.
const InlineDiffCell = memo(function InlineDiffCell({ lineNum, parts, side }) {
  return (
    <div className={`vd-cell ${side === 'left' ? 'delete left' : 'insert'}`}>
      <span className='vd-n'>{lineNum}</span>
      <span className='vd-t'>
        {parts.map((part, i) =>
          part.removed ? (
            side === 'left' && <mark key={i}>{part.value}</mark>
          ) : part.added ? (
            side === 'right' && <mark key={i}>{part.value}</mark>
          ) : (
            <span key={i}>{part.value}</span>
          )
        )}
      </span>
    </div>
  )
})

const DocumentField = ({ label, doc, onClick }) => (
  <div className='field'>
    <span className='lab'>{label}</span>
    <button className='input vd-pick' onClick={onClick}>
      <FileText className='lucide' />
      <span className={`trunc ${doc ? '' : 'faint'}`}>{doc ? doc.title || 'Untitled document' : 'Choose a document'}</span>
    </button>
  </div>
)

/**
 * Validate tools: run a backend tool by hand and look at what it returns. One tool today, the document diff the
 * agent's edit tools are built on: the patch between two documents, side by side.
 */
const ValidateToolsPage = () => {
  const { project, organizationId, projectId, href } = useAgent()
  const [docA, setDocA] = useState(null)
  const [docB, setDocB] = useState(null)
  const [picking, setPicking] = useState(null) // 'A' | 'B'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patch, setPatch] = useState(null)
  const [markdown, setMarkdown] = useState(false)

  const rows = useMemo(() => parsePatchTextToRows(patch), [patch])

  const run = async () => {
    setError('')
    setLoading(true)
    try {
      const response = await documentService.diffDocumentsPatchText(docA.id, docB.id, getToken())
      setPatch(response.data || '')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className='content'>
      <div className='list-h'>
        <div>
          <h2>Validate tools</h2>
          <p className='muted' style={{ marginTop: 4 }}>
            Run a tool by hand and see what it returns. The document diff compares two documents the way the agent’s
            edit tools see them.
          </p>
        </div>
        <span className='sp' />
        <Link className='btn' href={href('/gendox/agent-tools')}>
          <ArrowLeft className='lucide' />
          {project?.name ? `${project.name} tools` : 'Tools'}
        </Link>
      </div>

      <div className='vd-controls card'>
        <DocumentField label='Original (A)' doc={docA} onClick={() => setPicking('A')} />
        <DocumentField label='Modified (B)' doc={docB} onClick={() => setPicking('B')} />
        <button className='btn primary' onClick={run} disabled={!docA || !docB || loading}>
          {loading ? <Spinner size={14} /> : <Play className='lucide' />}
          Compare
        </button>
      </div>

      {error && (
        <div className='alert' style={{ '--c': 'var(--err)', marginTop: 16 }}>
          {error}
        </div>
      )}

      <div className='card vd' style={{ marginTop: 16 }}>
        <div className='vd-h'>
          <span>
            <i style={{ background: 'var(--err)' }} />
            Original (A)
          </span>
          <span>
            <i style={{ background: 'var(--ok)' }} />
            Modified (B)
            <span className='sp' />
            <label className='row sm muted' style={{ gap: 8 }} title='Unchanged lines as formatted text. Changed lines stay raw so the word marks stay right.'>
              Markdown
              <button className={`switch ${markdown ? 'on' : ''}`} onClick={() => setMarkdown(v => !v)} aria-label='Render markdown' />
            </label>
          </span>
        </div>
        <div className='vd-grid'>
          {patch === null ? (
            <p className='faint sm vd-empty'>Choose two documents and compare them.</p>
          ) : rows.length === 0 ? (
            <p className='faint sm vd-empty'>The two documents are the same.</p>
          ) : (
            rows.map((row, i) =>
              row.kind === 'hunk' ? (
                <div key={i} className='vd-hunk'>
                  {row.header}
                </div>
              ) : row.kind === 'inline-change' ? (
                <Fragment key={i}>
                  <InlineDiffCell lineNum={row.leftLineNum} parts={row.parts} side='left' />
                  <InlineDiffCell lineNum={row.rightLineNum} parts={row.parts} side='right' />
                </Fragment>
              ) : (
                <Fragment key={i}>
                  <DiffCell cell={row.left} markdown={markdown} left />
                  <DiffCell cell={row.right} markdown={markdown} />
                </Fragment>
              )
            )
          )}
        </div>
      </div>

      {patch !== null && (
        <details className='vd-raw'>
          <summary>
            <ChevronDown className='lucide' style={{ width: 14 }} />
            Patch text, as the tool returns it
          </summary>
          <pre>{patch}</pre>
        </details>
      )}

      <DocumentPicker
        open={picking !== null}
        onClose={() => setPicking(null)}
        title={picking === 'A' ? 'Original document (A)' : 'Modified document (B)'}
        organizationId={organizationId}
        projectId={projectId}
        onPickOne={doc => (picking === 'A' ? setDocA(doc) : setDocB(doc))}
      />
    </main>
  )
}

ValidateToolsPage.getLayout = page => (
  <AppLayout page='agents' title='Validate tools' crumb='Agents'>
    {page}
  </AppLayout>
)

ValidateToolsPage.pageConfig = {
  applyEffectiveOrgAndProjectIds: true
}

export default ValidateToolsPage
