import { useRef } from 'react'
import { registerGeeCompletions } from '../gee/monacoGeeProvider'

export default function useMonacoEditor() {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const providerDisposableRef = useRef(null)

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    providerDisposableRef.current?.dispose?.()
    providerDisposableRef.current = registerGeeCompletions(monaco)
  }

  return { editorRef, monacoRef, handleEditorDidMount }
}
