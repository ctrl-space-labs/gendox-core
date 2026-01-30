import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Editor from '@monaco-editor/react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { DEFAULT_GEE_CODE } from './geeDefaults'
import { registerGeeCompletions } from './monacoGeeProvider'
import { fetchLatestEOScriptThunk } from 'src/store/earthObservation/earthObservation'
import GeeRunner from '../../GeeRunner'

export default function EditorPanel() {
  const router = useRouter()
  const dispatch = useDispatch()
  const token = window.localStorage.getItem('accessToken')
  const { organizationId, taskId, projectId } = router.query
  const editorRef = useRef(null)
  const providerDisposableRef = useRef(null)
  const { latestEOScriptLoading, latestEOScript } = useSelector(
    state => state.earthObservation
  )

  const [code, setCode] = useState(DEFAULT_GEE_CODE)

  useEffect(() => {
    dispatch(
      fetchLatestEOScriptThunk({ organizationId: organizationId, projectId: projectId, taskId: taskId, token: token })
    )
  }, [dispatch, organizationId, projectId, taskId, token])

  useEffect(() => {
    const saved = latestEOScript?.scriptContent
    if (saved) setCode(saved)
  }, [latestEOScript])

  const onChange = value => {
    const v = value ?? ''
    setCode(v)
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    providerDisposableRef.current?.dispose?.()
    providerDisposableRef.current = registerGeeCompletions(monaco)
  }

 

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      

      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1, px: 1, pt: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, opacity: 0.85 }}>Earth Engine JavaScript</Typography>

        
        <GeeRunner
          code={code}
          getCurrentCode={() => editorRef.current?.getValue?.() ?? code}
          organizationId={organizationId}
          projectId={projectId}
          taskId={taskId}
          token={token}
        />
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
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
      </Box>
    </Box>
  )
}
