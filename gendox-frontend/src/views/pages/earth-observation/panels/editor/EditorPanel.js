import { useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import { Icon } from '@iconify/react'
import Editor from '@monaco-editor/react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { useAuth } from 'src/authentication/useAuth'
import { registerGeeCompletions } from './monacoGeeProvider'
import {
  fetchLatestEOScriptThunk,
  fetchEOScriptsThunk,
  resetEOScriptState,
  createEOScriptThunk
} from 'src/store/earthObservation/earthObservation'
import { editorCodeRef, runScriptRef, keepAllRef } from 'src/views/pages/earth-observation/panels/shared/editorState'
import GeeRunner from '../../GeeRunner'

// Sentinel used to mark that a tool edit is currently in flight.
// The ref is set to this value before executeEdits (which fires onChange synchronously)
// so onChange knows not to clear pending change state during a tool-driven edit.
const TOOL_EDIT_IN_FLIGHT = {}

/**
 * Translates original-script line numbers to current-document line numbers using
 * previously applied patches. Each patch that ends before a given line adds its
 * delta (newLineCount - replacedLineCount) to that line's offset.
 * @param {Array<{ originalStart: number, originalEnd: number, newLineCount: number }>} appliedPatches
 * @param {number} startLine - 1-based original start line
 * @param {number} endLine - 1-based original end line
 * @returns {{ translatedStart: number, translatedEnd: number }}
 */
function translateOriginalLinesToCurrent(appliedPatches, startLine, endLine) {
  let startOffset = 0
  let endOffset = 0
  for (const p of appliedPatches) {
    const replacedCount = p.originalEnd - p.originalStart + 1
    const delta = p.newLineCount - replacedCount
    if (startLine > p.originalEnd) startOffset += delta
    if (endLine > p.originalEnd) endOffset += delta
  }
  return {
    translatedStart: startLine + startOffset,
    translatedEnd: endLine + endOffset
  }
}

/**
 * Returns the number of lines in the given text (for patch delta calculation).
 * Empty or null is treated as 1 line so the offset matches Monaco: replacing
 * a range with "" still leaves one empty line in the model.
 */
function getNewTextLineCount(text) {
  if (text == null || text === '') return 1
  const lines = String(text).split(/\r?\n/)
  return lines.length || 1
}

/**
 * Builds Monaco decoration descriptors for whole-line highlight of the given range.
 * @param {object} monaco - Monaco namespace
 * @param {number} startLine - 1-based start (inclusive)
 * @param {number} endLine - 1-based end (inclusive)
 * @returns {Array<{ range: object, options: object }>}
 */
function buildPatchLineDecorations(monaco, startLine, endLine) {
  const decorations = []
  for (let L = startLine; L <= endLine; L++) {
    decorations.push({
      range: new monaco.Range(L, 1, L, 1),
      options: {
        isWholeLine: true,
        className: 'gendox-patch-changed-line',
        stickiness: 1
      }
    })
  }
  return decorations
}

function fmtRelative(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function EditorPanel() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { oidcAuthState } = useAuth()
  const token = oidcAuthState?.user?.access_token
  const { organizationId, taskId, projectId } = router.query
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const providerDisposableRef = useRef(null)
  const patchDecorationsRef = useRef([])
  const pendingChangeRef = useRef(null)
  const lastToolWrittenContentRef = useRef(null)
  // Each entry: { originalStart, originalEnd, newLineCount }
  // Tracks patches applied in the current batch so subsequent patches can
  // translate their original-script line numbers to current-document lines.
  const appliedPatchesRef = useRef([])
  const { latestEOScriptLoading, latestEOScript, eoScripts, createEOScriptLoading } = useSelector(
    state => state.earthObservation
  )


  const [code, setCode] = useState('')
  const [currentScriptName, setCurrentScriptName] = useState('New Script')
  const [currentVersionId, setCurrentVersionId] = useState(null)

  const [scriptMenuAnchor, setScriptMenuAnchor] = useState(null)
  const [versionMenuAnchor, setVersionMenuAnchor] = useState(null)
  const [newScriptDialogOpen, setNewScriptDialogOpen] = useState(false)
  const [newScriptNameInput, setNewScriptNameInput] = useState('')
  const [isFirstScript, setIsFirstScript] = useState(false)
  const [hasPendingChange, setHasPendingChange] = useState(false)

  // One entry per unique title — most recent first (eoScripts already sorted desc)
  const distinctScripts = useMemo(() => {
    const seen = new Set()
    return eoScripts.filter(s => {
      if (!s.title || seen.has(s.title)) return false
      seen.add(s.title)
      return true
    })
  }, [eoScripts])

  // All versions of the currently active named script
  const currentScriptVersions = useMemo(() => {
    return eoScripts.filter(s => s.title === currentScriptName)
  }, [eoScripts, currentScriptName])

  // The currently loaded version object
  const currentVersion = currentScriptVersions.find(v => v.id === currentVersionId) ?? currentScriptVersions[0] ?? null

  useEffect(() => {
    const doFetch = async () => {
      const [latestResult, allResult] = await Promise.all([
        dispatch(fetchLatestEOScriptThunk({ organizationId, projectId, taskId, token })),
        dispatch(fetchEOScriptsThunk({ organizationId, projectId, taskId, token }))
      ])

      // If the task has no scripts at all, prompt the user to name the first one
      const noScripts =
        allResult.payload == null || (Array.isArray(allResult.payload) && allResult.payload.length === 0)
      const noLatest = latestResult.payload == null
      if (noScripts && noLatest) {
        setIsFirstScript(true)
        setNewScriptNameInput('')
      }
    }

    doFetch()
    return () => {
      dispatch(resetEOScriptState())
      setIsFirstScript(false)
    }
  }, [dispatch, organizationId, projectId, taskId, token])

  useEffect(() => {
    if (latestEOScript?.scriptContent) {
      setCode(latestEOScript.scriptContent)
      editorCodeRef.current = latestEOScript.scriptContent
    }
    if (latestEOScript?.title) setCurrentScriptName(latestEOScript.title)
    if (latestEOScript?.id) setCurrentVersionId(latestEOScript.id)
  }, [latestEOScript])

  // Register tools with the widget SDK so the AI agent can call them.
  // The widget script is loaded asynchronously by ChatPanel, so we poll until
  // window.gendox.tools.registerTool is available before registering.
  useEffect(() => {
    let intervalId

    const register = () => {
      if (!window.gendox?.tools?.registerTool) return false

      window.gendox.tools.registerTool('apply_range_patch', ({ document_id, start_line, end_line, new_text, summary }) => {
        const editor = editorRef.current
        const monaco = monacoRef.current
        if (!editor || !monaco) return { success: false, error: 'Editor not ready' }
        const model = editor.getModel()
        if (!model) return { success: false, error: 'Editor model not ready' }

        const { translatedStart, translatedEnd } = translateOriginalLinesToCurrent(
          appliedPatchesRef.current,
          start_line,
          end_line
        )
        const lineCount = model.getLineCount()
        const start = Math.max(1, Math.min(translatedStart, lineCount))
        const end = Math.max(1, Math.min(translatedEnd, lineCount))
        if (start > end) {
          return { success: false, error: `Invalid range: start_line (${start_line}) must be <= end_line (${end_line})` }
        }

        const newLineCount = getNewTextLineCount(new_text)
        appliedPatchesRef.current.push({
          originalStart: start_line,
          originalEnd: end_line,
          newLineCount
        })

        const range = new monaco.Range(start, 1, end, model.getLineMaxColumn(end))
        const contentBeforeEdit = editor.getValue()

        lastToolWrittenContentRef.current = TOOL_EDIT_IN_FLIGHT
        editor.executeEdits('replace-line-range', [{ range, text: new_text ?? '' }])
        const updated = editor.getValue()
        lastToolWrittenContentRef.current = updated
        setCode(updated)
        editorCodeRef.current = updated

        if (!pendingChangeRef.current) {
          pendingChangeRef.current = { originalContent: contentBeforeEdit }
        }
        setHasPendingChange(true)

        const highlightEnd = start + newLineCount - 1
        const newDecorations = buildPatchLineDecorations(monaco, start, highlightEnd)
        if (newDecorations.length > 0) {
          const addedIds = editor.deltaDecorations([], newDecorations)
          patchDecorationsRef.current = [...patchDecorationsRef.current, ...addedIds]
        }
        return { success: true, summary }
      })

      window.gendox.tools.registerTool('execute_command', () => {
        console.log('execute_command')
        runScriptRef.current?.()
        return { success: true }
      })

      return true
    }

    if (!register()) {
      intervalId = setInterval(() => { if (register()) clearInterval(intervalId) }, 100)
    }

    return () => {
      clearInterval(intervalId)
      window.gendox?.tools?.removeTool?.('apply_range_patch')
      window.gendox?.tools?.removeTool?.('execute_command')
    }
  }, [])

  const clearChangeVisualization = () => {
    const editor = editorRef.current
    if (editor && patchDecorationsRef.current.length > 0) {
      editor.deltaDecorations(patchDecorationsRef.current, [])
      patchDecorationsRef.current = []
    }
    pendingChangeRef.current = null
    appliedPatchesRef.current = []
    setHasPendingChange(false)
  }

  const handleKeepAll = () => {
    clearChangeVisualization()
  }

  const handleUndoAll = () => {
    const pending = pendingChangeRef.current
    if (!pending) {
      clearChangeVisualization()
      return
    }
    const editor = editorRef.current
    if (editor && pending.originalContent !== undefined) {
      editor.setValue(pending.originalContent)
      setCode(pending.originalContent)
      editorCodeRef.current = pending.originalContent
    }
    clearChangeVisualization()
  }

  const onChange = value => {
    const v = value ?? ''
    setCode(v)
    editorCodeRef.current = v
    const last = lastToolWrittenContentRef.current
    if (last !== TOOL_EDIT_IN_FLIGHT && v !== last) {
      // Content differs from what the tool wrote → user edited manually
      clearChangeVisualization()
      lastToolWrittenContentRef.current = null
    }
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    providerDisposableRef.current?.dispose?.()
    providerDisposableRef.current = registerGeeCompletions(monaco)
  }

  // Pick a named script → load its latest version
  const handleSelectScript = script => {
    setCode(script.scriptContent)
    editorCodeRef.current = script.scriptContent
    editorRef.current?.setValue?.(script.scriptContent)
    setCurrentScriptName(script.title)
    setCurrentVersionId(script.id)
    setScriptMenuAnchor(null)
  }

  // Pick a specific version of the current script
  const handleSelectVersion = version => {
    setCode(version.scriptContent)
    editorCodeRef.current = version.scriptContent
    editorRef.current?.setValue?.(version.scriptContent)
    setCurrentVersionId(version.id)
    setVersionMenuAnchor(null)
  }

  const handleOpenNewScriptDialog = () => {
    setNewScriptNameInput('')
    setScriptMenuAnchor(null)
    setNewScriptDialogOpen(true)
  }

  const handleCreateNewScript = () => {
    const name = newScriptNameInput.trim() || 'New Script'
    setCurrentScriptName(name)
    setCurrentVersionId(null)
    setCode('')
    editorRef.current?.setValue?.('')
    setIsFirstScript(false)
    setNewScriptDialogOpen(false)
  }

  const handleSave = () => {
    const currentCode = (editorRef.current?.getValue?.() ?? code ?? '').trim()
    if (!currentCode || !organizationId || !projectId || !taskId || !token) return

    const d = new Date()
    const pad = n => String(n).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const description = `Saved – ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`

    dispatch(
      createEOScriptThunk({
        organizationId,
        projectId,
        taskId,
        eoScriptPayload: {
          title: currentScriptName || 'New Script',
          description,
          scriptContent: currentCode
        },
        token
      })
    )
  }

  const hasUnsavedChanges = code.trim() !== (currentVersion?.scriptContent ?? '').trim()

  // Keep the shared ref pointing to the latest handleKeepAll so ChatPanel
  // can invoke it without prop drilling (e.g. auto-accept before context capture).
  keepAllRef.current = handleKeepAll

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* ── Toolbar ── */}
      <Stack
        direction='row'
        alignItems='center'
        sx={{
          px: 1,
          minHeight: 40,
          borderBottom: '1px solid',
          borderColor: 'divider',
          gap: 0.5,
          flexShrink: 0
        }}
      >
        {/* Left: script context (name → version breadcrumb) */}
        <Stack direction='row' alignItems='center' gap={0.25} sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Script name */}
          <Tooltip title='Switch script' placement='bottom'>
            <Button
              size='small'
              variant='text'
              endIcon={<Icon icon='mdi:chevron-down' width={12} />}
              onClick={e => setScriptMenuAnchor(e.currentTarget)}
              sx={{ textTransform: 'none', px: 0.75, minWidth: 0, fontWeight: 600, fontSize: 12 }}
            >
              <Icon icon='mdi:file-code-outline' width={14} style={{ marginRight: 4, flexShrink: 0, opacity: 0.6 }} />
              <Typography noWrap sx={{ fontSize: 12, maxWidth: 130, fontWeight: 600 }}>
                {currentScriptName}
              </Typography>
              {/* Unsaved changes dot */}
              {hasUnsavedChanges && (
                <Box
                  component='span'
                  sx={{
                    ml: 0.5,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: 'warning.main',
                    flexShrink: 0,
                    display: 'inline-block'
                  }}
                />
              )}
            </Button>
          </Tooltip>

          <Menu
            anchorEl={scriptMenuAnchor}
            open={Boolean(scriptMenuAnchor)}
            onClose={() => setScriptMenuAnchor(null)}
            slotProps={{ paper: { sx: { minWidth: 220, maxHeight: 320 } } }}
          >
            {distinctScripts.map(script => (
              <MenuItem
                key={script.id}
                selected={script.title === currentScriptName}
                onClick={() => handleSelectScript(script)}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <Typography variant='body2' noWrap>
                    {script.title}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {fmtRelative(script.createdAt)}
                  </Typography>
                </Box>
                {script.title === currentScriptName && (
                  <Icon icon='mdi:check' width={14} style={{ marginLeft: 8, flexShrink: 0, opacity: 0.7 }} />
                )}
              </MenuItem>
            ))}

            {distinctScripts.length > 0 && <Divider />}

            <MenuItem onClick={handleOpenNewScriptDialog} disabled={isFirstScript}>
              <Icon icon='mdi:plus' width={16} style={{ marginRight: 8, opacity: 0.7 }} />
              <Typography variant='body2'>New Script...</Typography>
            </MenuItem>
          </Menu>

          {/* Breadcrumb separator + version */}
          {currentScriptVersions.length > 0 && (
            <>
              <Typography sx={{ opacity: 0.25, fontSize: 14, lineHeight: 1, flexShrink: 0 }}>/</Typography>

              <Tooltip title='Browse version history' placement='bottom'>
                <Button
                  size='small'
                  variant='text'
                  endIcon={<Icon icon='mdi:chevron-down' width={12} />}
                  onClick={e => setVersionMenuAnchor(e.currentTarget)}
                  sx={{ textTransform: 'none', px: 0.75, minWidth: 0, opacity: 0.65, fontSize: 11 }}
                >
                  <Icon icon='mdi:history' width={13} style={{ marginRight: 4, flexShrink: 0 }} />
                  <Typography noWrap sx={{ fontSize: 11, maxWidth: 150, color: 'text.secondary' }}>
                    {currentVersion?.description || 'latest'}
                  </Typography>
                </Button>
              </Tooltip>

              <Menu
                anchorEl={versionMenuAnchor}
                open={Boolean(versionMenuAnchor)}
                onClose={() => setVersionMenuAnchor(null)}
                slotProps={{ paper: { sx: { minWidth: 240, maxHeight: 320 } } }}
              >
                {currentScriptVersions.map(version => (
                  <MenuItem
                    key={version.id}
                    selected={version.id === currentVersionId}
                    onClick={() => handleSelectVersion(version)}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <Typography variant='body2' noWrap>
                        {version.description || 'Version'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {fmtRelative(version.createdAt)}
                      </Typography>
                    </Box>
                    {version.id === currentVersionId && (
                      <Icon icon='mdi:check' width={14} style={{ marginLeft: 8, flexShrink: 0, opacity: 0.7 }} />
                    )}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Stack>

        {/* Right: actions */}
        <Stack direction='row' alignItems='center' gap={0.5} sx={{ flexShrink: 0 }}>
          <Divider orientation='vertical' flexItem sx={{ mx: 0.25 }} />

          {/* Save (icon button) */}
          <Tooltip
            title={createEOScriptLoading ? 'Saving…' : hasUnsavedChanges ? 'Save changes' : 'Saved'}
            placement='bottom'
          >
            <span>
              <IconButton
                size='small'
                onClick={handleSave}
                disabled={createEOScriptLoading || !hasUnsavedChanges}
                sx={{ borderRadius: 1, color: hasUnsavedChanges ? 'warning.main' : 'text.disabled' }}
              >
                {createEOScriptLoading ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <Icon icon='mdi:content-save-outline' width={18} />
                )}
              </IconButton>
            </span>
          </Tooltip>

          {/* Keep all / Undo all (when there is a pending AI edit) */}
          {hasPendingChange && (
            <>
              <Tooltip title='Keep all changes and clear preview' placement='bottom'>
                <Button
                  size='small'
                  variant='outlined'
                  onClick={handleKeepAll}
                  startIcon={<Icon icon='mdi:check-all' width={16} />}
                  sx={{ textTransform: 'none', fontSize: 12, py: 0.25, borderColor: 'success.main', color: 'success.main' }}
                >
                  Keep all
                </Button>
              </Tooltip>
              <Tooltip title='Revert to content before this edit' placement='bottom'>
                <Button
                  size='small'
                  variant='outlined'
                  onClick={handleUndoAll}
                  startIcon={<Icon icon='mdi:undo' width={16} />}
                  sx={{ textTransform: 'none', fontSize: 12, py: 0.25, borderColor: 'text.secondary', color: 'text.secondary' }}
                >
                  Undo all
                </Button>
              </Tooltip>
            </>
          )}

          {/* Run Code */}
          <GeeRunner
            code={code}
            getCurrentCode={() => editorRef.current?.getValue?.() ?? code}
            organizationId={organizationId}
            projectId={projectId}
            taskId={taskId}
            token={token}
            scriptName={currentScriptName}
          />
        </Stack>
      </Stack>

      {/* ── Editor or First-script onboarding ── */}
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* CSS for patch-change line highlight (Monaco decoration) */}
        <style>{`
          .gendox-patch-changed-line {
            background-color: rgba(0, 255, 0, 0.15) !important;
          }
        `}</style>
        {isFirstScript ? (
          /* ── Inline onboarding: no code, no dialog, just this ── */
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              px: 4,
              background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.08) 100%)'
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Icon
                icon='mdi:satellite-variant'
                width={52}
                style={{ opacity: 0.18, display: 'block', margin: '0 auto 12px' }}
              />
              <Typography variant='h6' sx={{ fontWeight: 700, mb: 0.5 }}>
                Start your first script
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Give it a name and click Create.
              </Typography>
            </Box>

            <Stack direction='row' gap={1} sx={{ width: '100%', maxWidth: 380 }}>
              <TextField
                autoFocus
                fullWidth
                size='small'
                label='Script name'
                placeholder='e.g. NDVI Analysis'
                value={newScriptNameInput}
                onChange={e => setNewScriptNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newScriptNameInput.trim()) handleCreateNewScript()
                }}
              />
              <Button
                variant='contained'
                onClick={handleCreateNewScript}
                disabled={!newScriptNameInput.trim()}
                sx={{ flexShrink: 0, px: 2.5 }}
              >
                Create
              </Button>
            </Stack>
          </Box>
        ) : (
          <>
            {latestEOScriptLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.35)'
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <Editor
              height='100%'
              defaultLanguage='javascript'
              theme='vs-dark'
              value={code}
              onChange={onChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                readOnly: latestEOScriptLoading
              }}
            />
          </>
        )}
      </Box>

      {/* ── New Script dialog (for subsequent scripts from the menu) ── */}
      <Dialog open={newScriptDialogOpen} onClose={() => setNewScriptDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>New Script</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label='Script name'
            value={newScriptNameInput}
            onChange={e => setNewScriptNameInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newScriptNameInput.trim()) handleCreateNewScript()
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewScriptDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleCreateNewScript} disabled={!newScriptNameInput.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
