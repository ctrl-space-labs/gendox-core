import { useState, useRef } from 'react'

import { TOOL_EDIT_IN_FLIGHT } from '../utils/editorPatchUtils'
import { editorCodeRef } from 'src/views/pages/earth-observation/panels/shared/panelState'

export default function usePatchPreview({ editorRef, monacoRef, setCode }) {
  const [hasPendingChange, setHasPendingChange] = useState(false)
  const patchDecorationsRef = useRef([])
  const pendingChangeRef = useRef(null)
  // Each entry: { originalStart, originalEnd, newLineCount }
  const appliedPatchesRef = useRef([])
  const lastToolWrittenContentRef = useRef(null)

  const clearChangeVisualization = () => {
    const editor = editorRef.current
    if (editor && patchDecorationsRef.current.length > 0) {
      editor.deltaDecorations(patchDecorationsRef.current, [])
      patchDecorationsRef.current = []
    }
    pendingChangeRef.current = null
    appliedPatchesRef.current = []
    setHasPendingChange(false)
  }

  const handleKeepAll = () => {
    clearChangeVisualization()
  }

  const handleUndoAll = () => {
    const pending = pendingChangeRef.current
    if (!pending) {
      clearChangeVisualization()
      return
    }
    const editor = editorRef.current
    if (editor && pending.originalContent !== undefined) {
      editor.setValue(pending.originalContent)
      setCode(pending.originalContent)
      editorCodeRef.current = pending.originalContent
    }
    clearChangeVisualization()
  }

  const onChange = value => {
    const v = value ?? ''
    setCode(v)
    editorCodeRef.current = v
    const last = lastToolWrittenContentRef.current
    if (last !== TOOL_EDIT_IN_FLIGHT && v !== last) {
      // Content differs from what the tool wrote → user edited manually
      clearChangeVisualization()
      lastToolWrittenContentRef.current = null
    }
  }

  return {
    hasPendingChange,
    setHasPendingChange,
    patchDecorationsRef,
    pendingChangeRef,
    appliedPatchesRef,
    lastToolWrittenContentRef,
    clearChangeVisualization,
    handleKeepAll,
    handleUndoAll,
    onChange
  }
}
