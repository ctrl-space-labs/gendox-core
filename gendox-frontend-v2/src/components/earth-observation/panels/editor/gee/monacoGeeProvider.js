import { geeSuggestions } from './geeSuggestions'

/** Virtual lib so Monaco/TS does not warn "Cannot find name 'geometries'" — value is injected by gee-sandbox at Run Code. */
const GEE_SANDBOX_GLOBALS_DTS = `/** Injected by GEE Run Code sandbox (ee.Geometry values; keys = index, title string, slug). */
declare var geometries: Record<string | number, any>
`

export function registerGeeCompletions(monaco) {
  const extraLibDisposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(
    GEE_SANDBOX_GLOBALS_DTS,
    'file:///gendox/gee-sandbox-globals.d.ts'
  )

  const completionDisposable = monaco.languages.registerCompletionItemProvider('javascript', {
    triggerCharacters: ['.', 'e', 'M', 'g'],
    provideCompletionItems: () => {
      const suggestions = geeSuggestions.map(s => ({
        label: s.label,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: s.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: s.detail
      }))
      return { suggestions }
    }
  })

  return {
    dispose() {
      extraLibDisposable.dispose()
      completionDisposable.dispose()
    }
  }
}