import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import Spinner from 'src/components/ui/Spinner'
import FirstScriptOnboarding from './FirstScriptOnboarding'

// the app's colour mode (data-theme on <html>), so the editor matches it
const useAppTheme = () => {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const root = document.documentElement
    const read = () => setTheme(root.dataset.theme === 'light' ? 'light' : 'dark')
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })

    return () => observer.disconnect()
  }, [])

  return theme
}

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
  const theme = useAppTheme()

  if (isFirstScript) {
    return (
      <FirstScriptOnboarding
        newScriptNameInput={newScriptNameInput}
        setNewScriptNameInput={setNewScriptNameInput}
        onCreateNewScript={onCreateNewScript}
      />
    )
  }

  return (
    <div className='eo-monaco' style={{ position: 'relative' }}>
      {/* the lines the assistant just changed (a Monaco decoration) */}
      <style>{`.gendox-patch-changed-line { background-color: color-mix(in srgb, var(--ok) 16%, transparent) !important; }`}</style>
      {latestEOScriptLoading && (
        <div className='center' style={{ position: 'absolute', inset: 0, zIndex: 10, minHeight: 0, background: 'rgba(0,0,0,.25)' }}>
          <Spinner />
        </div>
      )}
      <Editor
        height='100%'
        defaultLanguage='javascript'
        theme={theme === 'light' ? 'vs' : 'vs-dark'}
        value={code}
        onChange={onChange}
        onMount={onMount}
        loading={<Spinner />}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          readOnly: latestEOScriptLoading
        }}
      />
    </div>
  )
}
