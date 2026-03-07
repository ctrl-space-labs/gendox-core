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
import { fetchLatestEOScriptThunk, fetchEOScriptsThunk, resetEOScriptState, createEOScriptThunk } from 'src/store/earthObservation/earthObservation'
import { editorCodeRef } from 'src/views/pages/earth-observation/editorState'
import GeeRunner from '../../GeeRunner'

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
  const providerDisposableRef = useRef(null)
  const { latestEOScriptLoading, latestEOScript, eoScripts, createEOScriptLoading } = useSelector(
    state => state.earthObservation
  )

  console.log('EditorCodeRef current value:', editorCodeRef.current)  // Debug log to verify the ref value

  const [code, setCode] = useState('')
  const [currentScriptName, setCurrentScriptName] = useState('New Script')
  const [currentVersionId, setCurrentVersionId] = useState(null)

  const [scriptMenuAnchor, setScriptMenuAnchor] = useState(null)
  const [versionMenuAnchor, setVersionMenuAnchor] = useState(null)
  const [newScriptDialogOpen, setNewScriptDialogOpen] = useState(false)
  const [newScriptNameInput, setNewScriptNameInput] = useState('')
  const [isFirstScript, setIsFirstScript] = useState(false)

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
  const currentVersion = currentScriptVersions.find(v => v.id === currentVersionId)
    ?? currentScriptVersions[0]
    ?? null

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

  const onChange = value => {
    const v = value ?? ''
    setCode(v)
    editorCodeRef.current = v
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
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
    const description = `Saved – ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`

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
                  <Typography variant='body2' noWrap>{script.title}</Typography>
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
          <Tooltip title={createEOScriptLoading ? 'Saving…' : hasUnsavedChanges ? 'Save changes' : 'Saved'} placement='bottom'>
            <span>
              <IconButton
                size='small'
                onClick={handleSave}
                disabled={createEOScriptLoading || !hasUnsavedChanges}
                sx={{ borderRadius: 1, color: hasUnsavedChanges ? 'warning.main' : 'text.disabled' }}
              >
                {createEOScriptLoading
                  ? <CircularProgress size={16} color='inherit' />
                  : <Icon icon='mdi:content-save-outline' width={18} />
                }
              </IconButton>
            </span>
          </Tooltip>

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
              <Icon icon='mdi:satellite-variant' width={52} style={{ opacity: 0.18, display: 'block', margin: '0 auto 12px' }} />
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
                onKeyDown={e => { if (e.key === 'Enter' && newScriptNameInput.trim()) handleCreateNewScript() }}
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
            onKeyDown={e => { if (e.key === 'Enter' && newScriptNameInput.trim()) handleCreateNewScript() }}
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
