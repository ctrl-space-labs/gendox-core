import Editor from '@monaco-editor/react'
import useAppTheme from 'src/hooks/useAppTheme'
import Spinner from 'src/components/ui/Spinner'
import FirstScriptOnboarding from './FirstScriptOnboarding'

// The editor in the app's colours (themes.css; Monaco takes hex only): the page background, keywords in the accent,
// strings in warn, numbers in info, comments faint
const THEMES = {
  'gendox-dark': {
    base: 'vs-dark',
    colors: { bg: '#1f2136', fg: '#cecedb', faint: '#a7a8b6', line: '#282a42', keyword: '#3dd6ae', string: '#f3b546', number: '#6cb8ff' }
  },
  'gendox-light': {
    base: 'vs',
    colors: { bg: '#f7f7f9', fg: '#4d4e64', faint: '#7d8094', line: '#eeeef5', keyword: '#008b6d', string: '#b26b00', number: '#0172cb' }
  }
}

const defineThemes = monaco => {
  Object.entries(THEMES).forEach(([name, { base, colors: c }]) =>
    monaco.editor.defineTheme(name, {
      base,
      inherit: true,
      rules: [
        { token: '', foreground: c.fg.slice(1) },
        { token: 'comment', foreground: c.faint.slice(1) },
        { token: 'keyword', foreground: c.keyword.slice(1) },
        { token: 'string', foreground: c.string.slice(1) },
        { token: 'number', foreground: c.number.slice(1) },
        { token: 'regexp', foreground: c.string.slice(1) }
      ],
      colors: {
        'editor.background': c.bg,
        'editor.foreground': c.fg,
        'editorLineNumber.foreground': c.faint,
        'editorLineNumber.activeForeground': c.fg,
        'editor.lineHighlightBackground': c.line,
        'editor.lineHighlightBorder': c.line,
        'editorGutter.background': c.bg,
        'editor.selectionBackground': '#08b68d40',
        'editorCursor.foreground': c.keyword,
        'editorIndentGuide.background1': c.line,
        'scrollbarSlider.background': c.faint + '33'
      }
    })
  )
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
        theme={theme === 'light' ? 'gendox-light' : 'gendox-dark'}
        beforeMount={defineThemes}
        value={code}
        onChange={onChange}
        onMount={onMount}
        loading={<Spinner />}
        options={{
          minimap: { enabled: false },
          fontSize: 12.5,
          lineHeight: 22,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          renderLineHighlight: 'line',
          scrollBeyondLastLine: false,
          padding: { top: 8 },
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          readOnly: latestEOScriptLoading
        }}
      />
    </div>
  )
}
