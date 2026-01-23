import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress' 
import Editor from '@monaco-editor/react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { DEFAULT_GEE_CODE } from './geeDefaults'
import { registerGeeCompletions } from './monacoGeeProvider'
import { setMapData, createEOScriptThunk } from 'src/store/earthObservation/earthObservation' 
import { executeGeeCode } from '../../utils/geeRunner'
import { tooltip } from 'leaflet'

export default function EditorPanel() {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const editorRef = useRef(null)
  const providerDisposableRef = useRef(null)
  const { createEOScriptLoading } = useSelector((state) => state.earthObservation)

  const [code, setCode] = useState(DEFAULT_GEE_CODE)

  useEffect(() => {
    const saved = localStorage.getItem('earthObservationGeeCode')
    if (saved) setCode(saved)
  }, [])

  const onChange = value => {
    const v = value ?? ''
    setCode(v)
    localStorage.setItem('earthObservationGeeCode', v)
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    providerDisposableRef.current?.dispose?.()
    providerDisposableRef.current = registerGeeCompletions(monaco)
  }

  // --- Run GEE Code ---
  const onRun = async () => {
    const currentCode = editorRef.current?.getValue?.() ?? code
    if (!currentCode) return

    try {
      console.log('[GEE RUN] Executing...')      
      const result = await executeGeeCode(currentCode)
      dispatch(setMapData(result))

      // Save the EOScript to backend
      if (organizationId && projectId && taskId && token) {
        dispatch(
          createEOScriptThunk({
            organizationId,
            projectId,
            taskId,
            eoScriptPayload: {
              title: 'Latest GEE Script',
              description: 'Auto-saved from Editor Run',
              scriptContent: currentCode
            },
            token
          })
        )
      }
    } catch (error) {
      console.error('[GEE RUN] Error:', error)
      tooltip('Error executing GEE code. Check console for details.').openOn()
    } 
  }

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1, px: 1, pt: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, opacity: 0.85 }}>Earth Engine JavaScript</Typography>

        <Button
          size='small'
          variant='contained'
          onClick={onRun}
          disabled={createEOScriptLoading}
          startIcon={createEOScriptLoading && <CircularProgress size={16} color='inherit' />}
        >
          {createEOScriptLoading ? 'Processing...' : 'Run'}
        </Button>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0 }}>
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
            tabSize: 2
          }}
        />
      </Box>
    </Box>
  )
}
