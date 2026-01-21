import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Editor from '@monaco-editor/react'

import { DEFAULT_GEE_CODE } from './geeDefaults'
import { registerGeeCompletions } from './monacoGeeProvider'

export default function EditorPanel() {
  const editorRef = useRef(null)
  const providerDisposableRef = useRef(null)

  const [code, setCode] = useState(DEFAULT_GEE_CODE)

  useEffect(() => {
    const saved = localStorage.getItem('seaScopeGeeCode')
    if (saved) setCode(saved)
  }, [])

  const onChange = value => {
    const v = value ?? ''
    setCode(v)
    localStorage.setItem('seaScopeGeeCode', v)
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor

    // (optional) register GEE completions
    providerDisposableRef.current?.dispose?.()
    providerDisposableRef.current = registerGeeCompletions(monaco)
  }

  const onRun = () => {
    const currentCode = editorRef.current?.getValue?.() ?? code
    console.log('[GEE RUN] code:', currentCode)

    // Later Post to backend
  }

  return (
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13, opacity: 0.85 }}>
          Earth Engine JavaScript
        </Typography>

        <Button size='small' variant='contained' onClick={onRun}>
          Run
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