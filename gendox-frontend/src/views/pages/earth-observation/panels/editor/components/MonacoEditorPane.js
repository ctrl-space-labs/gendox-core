import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Editor from '@monaco-editor/react'

import FirstScriptOnboarding from './FirstScriptOnboarding'

export default function MonacoEditorPane({
  code,
  latestEOScriptLoading,
  isFirstScript,
  newScriptNameInput,
  setNewScriptNameInput,
  onCreateNewScript,
  onChange,
  onMount
}) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
      {/* CSS for patch-change line highlight (Monaco decoration) */}
      <style>{`
        .gendox-patch-changed-line {
          background-color: rgba(0, 255, 0, 0.15) !important;
        }
      `}</style>

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
        onMount={onMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          readOnly: latestEOScriptLoading
        }}
      />
      {isFirstScript && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            height: '100%',
            pointerEvents: 'auto'
          }}
        >
          <FirstScriptOnboarding
            newScriptNameInput={newScriptNameInput}
            setNewScriptNameInput={setNewScriptNameInput}
            onCreateNewScript={onCreateNewScript}
          />
        </Box>
      )}
    </Box>
  )
}
