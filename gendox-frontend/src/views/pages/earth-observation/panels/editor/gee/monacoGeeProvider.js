import { geeSuggestions } from './geeSuggestions'

export function registerGeeCompletions(monaco) {
  return monaco.languages.registerCompletionItemProvider('javascript', {
    triggerCharacters: ['.', 'e', 'M'],
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
}