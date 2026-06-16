import { Fragment, memo, useMemo, useState } from 'react'
import { diffWords } from 'diff'
import { useRouter } from 'next/router'
import { useTheme } from '@mui/material/styles'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Collapse from '@mui/material/Collapse'
import Tooltip from '@mui/material/Tooltip'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

import Icon from 'src/views/custom-components/mui/icon/icon'
import { useAuth } from 'src/authentication/useAuth'
import { localStorageConstants } from 'src/utils/generalConstants'
import documentService from 'src/gendox-sdk/documentService'
import AddNewDocumentDialog from 'src/views/pages/tasks/helping-components/AddNewDocumentDialog'

const TOOL_IDS = { DOCUMENT_DIFF: 'document-diff' }

// ─── Patch parser ─────────────────────────────────────────────────────────────
/**
 * Parse the decoded unified diff text into aligned row descriptors.
 *
 * The tricky part: patchToDecodedText() URL-decodes the patch, so any %0A that
 * diff-match-patch used to encode in-operation newlines becomes a real '\n'.
 * A naive split('\n') then sees those continuation lines without a '-'/'+'/''
 * prefix and misidentifies them as context lines.
 *
 * Two-pass fix:
 *   Pass 1 — group continuation lines back onto their parent operation.
 *   Pass 2 — expand ops whose text contains '\n' into individual single-line rows,
 *             each inheriting the parent's op type.
 *
 * Row kinds emitted:
 *   hunk          – @@ header spanning both columns
 *   context       – unchanged line appearing in both panels
 *   inline-change – paired del+ins row with per-word highlights
 *   change        – unpaired delete-only or insert-only
 */
function parsePatchTextToRows(patchText) {
  const rawLines = String(patchText || '').replace(/\r\n/g, '\n').split('\n')

  // ── Pass 1: reconstruct logical operations ────────────────────────────────
  // After URL-decoding, a single diff op may span several rawLines when the
  // original text contained newlines (encoded as %0A before decoding).
  const ops = []   // {op: '@@'|'-'|'+'|' ', text: string}
  let cur = null

  for (const rawLine of rawLines) {
    if (rawLine.startsWith('@@')) {
      if (cur) { ops.push(cur); cur = null }
      ops.push({ op: '@@', text: rawLine })
      continue
    }
    if (rawLine.startsWith('---') || rawLine.startsWith('+++') || rawLine.startsWith('\\ No newline')) {
      if (cur) { ops.push(cur); cur = null }
      continue
    }

    const pfx = rawLine.length > 0 ? rawLine[0] : null
    if (pfx === '-' || pfx === '+' || pfx === ' ') {
      if (cur) ops.push(cur)
      cur = { op: pfx, text: rawLine.slice(1) }
    } else {
      // Continuation — part of the previous op's text after URL-decoding %0A → \n
      if (cur) cur.text += '\n' + rawLine
      else cur = { op: ' ', text: rawLine }  // safety fallback
    }
  }
  if (cur) ops.push(cur)

  // ── Pass 2: expand multi-line ops into one entry per display line ─────────
  const items = []   // {op: '@@'|'-'|'+'|' ', text: string}  (always single-line)
  for (const op of ops) {
    if (op.op === '@@') {
      items.push(op)
    } else {
      const subLines = op.text.split('\n')
      for (const sub of subLines) {
        items.push({ op: op.op, text: sub })
      }
    }
  }

  // ── Pass 3: build aligned diff rows ──────────────────────────────────────
  const rows = []
  let pendingDel = [], pendingIns = []
  let leftLine = 0, rightLine = 0, delStart = 0, insStart = 0

  const flushChange = () => {
    if (!pendingDel.length && !pendingIns.length) return
    const len = Math.max(pendingDel.length, pendingIns.length)
    for (let i = 0; i < len; i++) {
      const del = i < pendingDel.length ? pendingDel[i] : null
      const ins = i < pendingIns.length ? pendingIns[i] : null

      if (del !== null && ins !== null) {
        rows.push({
          kind: 'inline-change',
          leftLineNum:  delStart + i,
          rightLineNum: insStart + i,
          parts: diffWords(del, ins)
        })
      } else if (del !== null) {
        rows.push({ kind: 'change', left: { text: del, kind: 'delete', lineNum: delStart + i }, right: { text: '', kind: 'empty', lineNum: null } })
      } else {
        rows.push({ kind: 'change', left: { text: '', kind: 'empty', lineNum: null }, right: { text: ins, kind: 'insert', lineNum: insStart + i } })
      }
    }
    pendingDel = []; pendingIns = []
  }

  for (const item of items) {
    if (item.op === '@@') {
      flushChange()
      const m = item.text.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/)
      if (m) { leftLine = +m[1]; rightLine = +m[2] }
      rows.push({ kind: 'hunk', header: item.text })
      continue
    }

    if (item.op === '-') {
      if (!pendingDel.length) delStart = leftLine
      pendingDel.push(item.text); leftLine++
    } else if (item.op === '+') {
      if (!pendingIns.length) insStart = rightLine
      pendingIns.push(item.text); rightLine++
    } else {
      flushChange()
      rows.push({
        kind:  'context',
        left:  { text: item.text, kind: 'context', lineNum: leftLine++ },
        right: { text: item.text, kind: 'context', lineNum: rightLine++ }
      })
    }
  }
  flushChange()
  return rows
}

function isUuidLike(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || '').trim())
}

// ─── Shared cell layout ───────────────────────────────────────────────────────
const CELL_BASE = {
  display:    'flex',
  alignItems: 'flex-start',
  minHeight:  22
}
const TEXT_BOX = {
  flex:        1,
  px:          1,
  fontFamily:  '"Roboto Mono", "Courier New", monospace',
  fontSize:    12.5,
  lineHeight:  1.75,
  whiteSpace:  'pre-wrap',
  wordBreak:   'break-word'
}
const LINE_NUM_BOX = {
  width:      44,
  minWidth:   44,
  textAlign:  'right',
  pr:         1.5,
  pl:         1,
  color:      'text.disabled',
  userSelect: 'none',
  fontFamily: '"Roboto Mono", "Courier New", monospace',
  fontSize:   11,
  lineHeight: '22px',
  flexShrink: 0
}

// Tight styles so markdown paragraphs/lists don't add extra spacing that would
// break the vertical alignment between the two grid columns.
const MD_CELL_STYLES = {
  flex:      1,
  px:        1,
  fontSize:  13,
  lineHeight: 1.75,
  wordBreak: 'break-word',
  '& p':           { m: 0, lineHeight: 1.75 },
  '& ul, & ol':    { m: 0, pl: '1.4em' },
  '& li':          { my: 0 },
  '& h1, & h2, & h3, & h4, & h5, & h6': { m: 0, fontWeight: 700, lineHeight: 1.75 },
  '& blockquote':  { m: 0, pl: 1, borderLeft: '2px solid rgba(128,128,128,0.4)' },
  '& code':        { fontFamily: '"Roboto Mono","Courier New",monospace', fontSize: '0.875em', px: '3px', py: '1px', borderRadius: '2px', backgroundColor: 'rgba(128,128,128,0.15)' },
  '& pre':         { m: 0 },
  '& strong':      { fontWeight: 700 },
  '& table':       { borderCollapse: 'collapse', fontSize: 12.5 },
  '& th, & td':    { border: '1px solid rgba(128,128,128,0.4)', px: 1, py: '2px' }
}

// ─── DiffCell — whole-line highlight (context / standalone change) ─────────────
const DiffCell = memo(function DiffCell({ cell, borderRight, colors, renderMarkdown }) {
  const gutterColor =
    cell.kind === 'delete' ? colors.deleteBar :
    cell.kind === 'insert' ? colors.insertBar : 'transparent'
  const bgColor =
    cell.kind === 'delete' ? colors.deleteBg :
    cell.kind === 'insert' ? colors.insertBg :
    cell.kind === 'empty'  ? colors.emptyBg  : 'transparent'

  const useMarkdown = renderMarkdown && cell.kind === 'context'

  return (
    <Box
      sx={{
        ...CELL_BASE,
        backgroundColor: bgColor,
        borderLeft:  `3px solid ${gutterColor}`,
        borderRight: borderRight ? (t => `1px solid ${t.palette.divider}`) : 'none'
      }}
    >
      <Box sx={LINE_NUM_BOX}>{cell.lineNum ?? ''}</Box>
      {useMarkdown
        ? (
          <Box sx={MD_CELL_STYLES}>
            <Markdown remarkPlugins={[remarkGfm]}>{cell.text || ''}</Markdown>
          </Box>
        )
        : (
          <Box sx={{ ...TEXT_BOX, color: cell.kind === 'empty' ? 'transparent' : 'text.primary' }}>
            {cell.text || (cell.kind === 'empty' ? '\u200b' : '')}
          </Box>
        )
      }
    </Box>
  )
})

// ─── InlineDiffCell — word-level highlight for paired (del, ins) rows ─────────
// Changed lines are always shown as plain text — word-level highlights cannot
// be combined with a block markdown renderer without losing alignment.
const InlineDiffCell = memo(function InlineDiffCell({ lineNum, parts, side, borderRight, colors }) {
  const gutterColor = side === 'left' ? colors.deleteBar : colors.insertBar
  const rowBg       = side === 'left' ? colors.deleteBg  : colors.insertBg

  return (
    <Box
      sx={{
        ...CELL_BASE,
        backgroundColor: rowBg,
        borderLeft:  `3px solid ${gutterColor}`,
        borderRight: borderRight ? (t => `1px solid ${t.palette.divider}`) : 'none'
      }}
    >
      <Box sx={LINE_NUM_BOX}>{lineNum}</Box>
      <Box sx={TEXT_BOX}>
        {parts.map((part, i) => {
          if (part.removed && side === 'left') {
            return (
              <span key={i} style={{ backgroundColor: colors.inlineDeleteBg, borderRadius: 2, padding: '0 1px' }}>
                {part.value}
              </span>
            )
          }
          if (part.added && side === 'right') {
            return (
              <span key={i} style={{ backgroundColor: colors.inlineInsertBg, borderRadius: 2, padding: '0 1px' }}>
                {part.value}
              </span>
            )
          }
          if (!part.removed && !part.added) return <span key={i}>{part.value}</span>
          return null
        })}
      </Box>
    </Box>
  )
})

// ─── Page ─────────────────────────────────────────────────────────────────────
const ValidateToolsPage = () => {
  const router  = useRouter()
  const theme   = useTheme()
  const isDark  = theme.palette.mode === 'dark'

  // Memoized color palette — stable reference across re-renders caused by parent
  // components (e.g., layout media-query hooks on window resize).
  const colors = useMemo(() => ({
    deleteBg:       isDark ? 'rgba(255,80, 80, 0.12)' : 'rgba(255,80, 80, 0.06)',
    deleteBar:      isDark ? '#ff6b6b'                : '#e53935',
    inlineDeleteBg: isDark ? 'rgba(255,80, 80, 0.50)' : 'rgba(255,80, 80, 0.28)',
    insertBg:       isDark ? 'rgba(80,220,120, 0.12)' : 'rgba(56,142, 60, 0.06)',
    insertBar:      isDark ? '#69f0ae'                : '#2e7d32',
    inlineInsertBg: isDark ? 'rgba(80,220,120, 0.50)' : 'rgba(56,142, 60, 0.25)',
    emptyBg:        isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    hunkBg:         isDark ? 'rgba(100,181,246,0.12)' : 'rgba(21,101,192,0.06)',
    hunkText:       isDark ? '#90caf9'                : '#1565c0'
  }), [isDark])

  const { oidcAuthState } = useAuth()
  const token =
    oidcAuthState?.user?.access_token ||
    (typeof window !== 'undefined' ? window.localStorage.getItem(localStorageConstants.accessTokenKey) : null)

  const [selectedTool,     setSelectedTool]     = useState(TOOL_IDS.DOCUMENT_DIFF)
  const [documentAId,      setDocumentAId]      = useState('')
  const [documentBId,      setDocumentBId]      = useState('')
  const [documentAName,    setDocumentAName]    = useState('')
  const [documentBName,    setDocumentBName]    = useState('')
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')
  const [patchTextDecoded, setPatchTextDecoded] = useState('')
  const [showDebug,        setShowDebug]        = useState(false)
  const [renderMarkdown,   setRenderMarkdown]   = useState(false)
  const [pickerOpen,       setPickerOpen]       = useState(false)
  const [pickerTarget,     setPickerTarget]     = useState(null) // 'A' | 'B'

  const toolOptions = useMemo(() => [{ id: TOOL_IDS.DOCUMENT_DIFF, label: 'Document diff tool' }], [])

  const organizationId = router.query.organizationId
  const projectId = router.query.projectId

  const openPicker = target => {
    setPickerTarget(target)
    setPickerOpen(true)
  }

  const closePicker = () => {
    setPickerOpen(false)
    setPickerTarget(null)
  }

  const handlePickedDocuments = docs => {
    const doc = Array.isArray(docs) ? docs[0] : null
    if (!doc?.id) return

    if (pickerTarget === 'A') {
      setDocumentAId(doc.id)
      setDocumentAName(doc.title || 'Untitled Document')
    } else if (pickerTarget === 'B') {
      setDocumentBId(doc.id)
      setDocumentBName(doc.title || 'Untitled Document')
    }
    closePicker()
  }

  const handleRun = async () => {
    setError(''); setPatchTextDecoded('')
    if (!token) { setError('Missing access token.'); return }

    if (selectedTool === TOOL_IDS.DOCUMENT_DIFF) {
      const a = documentAId.trim(), b = documentBId.trim()
      if (!isUuidLike(a) || !isUuidLike(b)) { setError('Please provide two valid UUID document IDs.'); return }
      setLoading(true)
      try {
        const res = await documentService.diffDocumentsPatchText(a, b, token)
        setPatchTextDecoded(res.data || '')
      } catch (e) {
        setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Failed to validate tool.')
      } finally { setLoading(false) }
    }
  }

  // parsePatchTextToRows is memoized — diffWords runs once per patchTextDecoded change,
  // not on every render triggered by parent resize / theme events.
  const rows    = useMemo(() => parsePatchTextToRows(patchTextDecoded), [patchTextDecoded])
  const hasRows = rows.length > 0

  return (
    <Card sx={{ p: 6 }}>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant='h4' sx={{ fontWeight: 600, mb: 1 }}>Validate tools</Typography>
          <Typography variant='body2' color='text.secondary'>
            Run validations against backend tool endpoints and inspect results.
          </Typography>
        </Box>
        <Button
          variant='outlined'
          startIcon={<Icon icon='mdi:arrow-left-bold' />}
          onClick={() => router.push(
            `/gendox/project-settings/?organizationId=${router.query.organizationId || ''}&projectId=${router.query.projectId || ''}`
          )}
        >
          Back to project settings
        </Button>
      </Box>

      <Divider sx={{ my: 5 }} />
      {error && <Alert severity='error' sx={{ mb: 4 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* ── Controls ── */}
        <Grid item xs={12} md={3}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel id='vt-tool-label'>Tool</InputLabel>
              <Select labelId='vt-tool-label' label='Tool' value={selectedTool} onChange={e => setSelectedTool(e.target.value)}>
                {toolOptions.map(o => <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>

            {selectedTool === TOOL_IDS.DOCUMENT_DIFF && (
              <>
                <TextField
                  label='Document A (original)'
                  value={documentAId}
                  onClick={() => openPicker('A')}
                  placeholder='Click to select…'
                  fullWidth
                  inputProps={{ readOnly: true }}
                  helperText={documentAName ? `Selected: ${documentAName}` : 'Click to search by name and select'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton edge='end' onClick={() => openPicker('A')} aria-label='Select document A'>
                          <Icon icon='mdi:magnify' />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <TextField
                  label='Document B (modified)'
                  value={documentBId}
                  onClick={() => openPicker('B')}
                  placeholder='Click to select…'
                  fullWidth
                  inputProps={{ readOnly: true }}
                  helperText={documentBName ? `Selected: ${documentBName}` : 'Click to search by name and select'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton edge='end' onClick={() => openPicker('B')} aria-label='Select document B'>
                          <Icon icon='mdi:magnify' />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </>
            )}

            <Button
              variant='contained'
              startIcon={loading ? <CircularProgress size={18} /> : <Icon icon='mdi:play' />}
              disabled={loading}
              onClick={handleRun}
            >
              Run validation
            </Button>

            <Divider />

            <Tooltip title='Context lines are rendered as formatted text. Changed lines always show raw syntax so word-level highlights remain accurate.' placement='right'>
              <Button
                variant={renderMarkdown ? 'contained' : 'outlined'}
                size='small'
                startIcon={<Icon icon={renderMarkdown ? 'mdi:language-markdown' : 'mdi:language-markdown-outline'} />}
                onClick={() => setRenderMarkdown(v => !v)}
              >
                {renderMarkdown ? 'Markdown on' : 'Markdown off'}
              </Button>
            </Tooltip>

            <Button variant='text' size='small' onClick={() => setShowDebug(v => !v)} startIcon={<Icon icon={showDebug ? 'mdi:chevron-up' : 'mdi:chevron-down'} />}>
              {showDebug ? 'Hide raw patch text' : 'Show raw patch text'}
            </Button>
          </Stack>
        </Grid>

        {/* ── Diff viewer ── */}
        <Grid item xs={12} md={9}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ borderRadius: 1, border: t => `1px solid ${t.palette.divider}`, overflow: 'hidden' }}>

              {/* Column headers */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: 'action.hover', borderBottom: t => `1px solid ${t.palette.divider}` }}>
                {[
                  { label: 'Original (A)', dot: colors.deleteBar },
                  { label: 'Modified (B)', dot: colors.insertBar }
                ].map((h, i) => (
                  <Box key={i} sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderRight: i === 0 ? (t => `1px solid ${t.palette.divider}`) : 'none' }}>
                    <Box sx={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: h.dot, flexShrink: 0 }} />
                    <Typography variant='subtitle2'>{h.label}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Single scrollable grid — one scrollbar, browser-guaranteed row alignment */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxHeight: 620, overflow: 'auto' }}>
                {!hasRows && (
                  <Box sx={{ gridColumn: '1 / -1', p: 4 }}>
                    <Typography variant='body2' color='text.secondary'>Run a validation to see results here.</Typography>
                  </Box>
                )}

                {rows.map((row, idx) => {
                  // ── Hunk header ──────────────────────────────────────────────
                  if (row.kind === 'hunk') {
                    return (
                      <Box key={`h${idx}`} sx={{ gridColumn: '1 / -1', px: 2, py: '5px', backgroundColor: colors.hunkBg, color: colors.hunkText, fontFamily: '"Roboto Mono", monospace', fontSize: 11, borderTop: t => `1px solid ${t.palette.divider}`, borderBottom: t => `1px solid ${t.palette.divider}` }}>
                        {row.header}
                      </Box>
                    )
                  }

                  // ── Inline-change row (word-level highlights) ────────────────
                  // Both cells share the same grid row → height is always equal.
                  if (row.kind === 'inline-change') {
                    return (
                      <Fragment key={`r${idx}`}>
                        <InlineDiffCell lineNum={row.leftLineNum}  parts={row.parts} side='left'  borderRight colors={colors} />
                        <InlineDiffCell lineNum={row.rightLineNum} parts={row.parts} side='right' borderRight={false} colors={colors} />
                      </Fragment>
                    )
                  }

                  // ── Context / standalone delete or insert ────────────────────
                  return (
                    <Fragment key={`r${idx}`}>
                      <DiffCell cell={row.left}  borderRight colors={colors} renderMarkdown={renderMarkdown} />
                      <DiffCell cell={row.right} borderRight={false} colors={colors} renderMarkdown={renderMarkdown} />
                    </Fragment>
                  )
                })}
              </Box>
            </Box>

            {/* ── Raw patch text (collapsed) ── */}
            <Collapse in={showDebug}>
              <Box sx={{ p: 3, borderRadius: 1, border: t => `1px solid ${t.palette.divider}` }}>
                <Typography variant='subtitle2' sx={{ mb: 2 }}>Patch text (decoded) — tool ingestion payload</Typography>
                <TextField fullWidth multiline minRows={10} value={patchTextDecoded} />
              </Box>
            </Collapse>
          </Box>
        </Grid>
      </Grid>

      <AddNewDocumentDialog
        open={pickerOpen}
        onClose={closePicker}
        existingDocumentIds={[]}
        loading={false}
        onConfirm={() => {}}
        onConfirmDocuments={handlePickedDocuments}
        organizationId={organizationId}
        projectId={projectId}
        token={token}
        taskId={null}
        taskType='document-digitization'
        allowUpload={false}
        multiSelect={false}
        title={pickerTarget === 'A' ? 'Select Document A (original)' : 'Select Document B (modified)'}
      />
    </Card>
  )
}

ValidateToolsPage.pageConfig = { applyEffectiveOrgAndProjectIds: true }

export default ValidateToolsPage
