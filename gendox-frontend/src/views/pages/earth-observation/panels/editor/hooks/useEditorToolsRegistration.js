import { useEffect } from 'react'

import {
  TOOL_EDIT_IN_FLIGHT,
  translateOriginalLinesToCurrent,
  getNewTextLineCount,
  buildPatchLineDecorations
} from '../utils/editorPatchUtils'
import { editorCodeRef, runScriptRef } from 'src/views/pages/earth-observation/panels/shared/panelState'

export default function useEditorToolsRegistration({
  editorRef,
  monacoRef,
  appliedPatchesRef,
  pendingChangeRef,
  patchDecorationsRef,
  lastToolWrittenContentRef,
  setCode,
  setHasPendingChange,
  eoScriptsRef
}) {
  useEffect(() => {
    let intervalId
    let registered = false
    let registeredOnTools = null

    const register = () => {
      if (!window.gendox?.tools?.registerTool) return false
      if (window.gendox.tools === registeredOnTools) return true
      registeredOnTools = window.gendox.tools
      window.gendox.tools.registerTool(
        'apply_range_patch',
        ({ document_id, start_line, end_line, new_text, summary }) => {
          const eoScripts = eoScriptsRef.current
          if (eoScripts.isFirstScript) {
            eoScripts.handleAutoCreateFromChat()
          }
          const editor = editorRef.current
          const monaco = monacoRef.current
          if (!editor || !monaco) return { success: false, error: 'Editor not ready' }
          const model = editor.getModel()
          if (!model) return { success: false, error: 'Editor model not ready' }

          const { translatedStart, translatedEnd } = translateOriginalLinesToCurrent(
            appliedPatchesRef.current,
            start_line,
            end_line
          )
          const lineCount = model.getLineCount()
          const start = Math.max(1, Math.min(translatedStart, lineCount))
          const end = Math.max(1, Math.min(translatedEnd, lineCount))
          if (start > end) {
            return {
              success: false,
              error: `Invalid range: start_line (${start_line}) must be <= end_line (${end_line})`
            }
          }

          const newLineCount = getNewTextLineCount(new_text)
          appliedPatchesRef.current.push({ originalStart: start_line, originalEnd: end_line, newLineCount })

          const range = new monaco.Range(start, 1, end, model.getLineMaxColumn(end))
          const contentBeforeEdit = editor.getValue()

          lastToolWrittenContentRef.current = TOOL_EDIT_IN_FLIGHT
          editor.executeEdits('replace-line-range', [{ range, text: new_text ?? '' }])
          const updated = editor.getValue()
          lastToolWrittenContentRef.current = updated
          setCode(updated)
          editorCodeRef.current = updated

          if (!pendingChangeRef.current) {
            pendingChangeRef.current = { originalContent: contentBeforeEdit }
          }
          setHasPendingChange(true)

          const highlightEnd = start + newLineCount - 1
          const newDecorations = buildPatchLineDecorations(monaco, start, highlightEnd)
          if (newDecorations.length > 0) {
            const addedIds = editor.deltaDecorations([], newDecorations)
            patchDecorationsRef.current = [...patchDecorationsRef.current, ...addedIds]
          }
          return { success: true, summary }
        }
      )

      window.gendox.tools.registerTool('execute_command', () => {
        console.log('execute_command')
        setTimeout(() => runScriptRef.current?.(), 0)
        return { success: true }
      })

      registered = true
      return true
    }

    register()
    // try again in 0.5s in case tools aren't ready yet TODO change this to an event-based system if possible
    intervalId = setInterval(() => register(), 500)

    return () => {
      clearInterval(intervalId)
      if (registered) {
        window.gendox?.tools?.removeTool?.('apply_range_patch')
        window.gendox?.tools?.removeTool?.('execute_command')
      }
    }
  }, [])
}
