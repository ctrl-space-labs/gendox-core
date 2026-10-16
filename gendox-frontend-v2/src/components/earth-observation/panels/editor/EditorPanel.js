import { useState, useRef } from 'react'
import { useRouter } from 'next/router'

import { localStorageConstants } from 'src/utils/generalConstants'
import { keepAllRef } from 'src/components/earth-observation/panels/shared/panelState'

import useMonacoEditor from './hooks/useMonacoEditor'
import usePatchPreview from './hooks/usePatchPreview'
import useEditorToolsRegistration from './hooks/useEditorToolsRegistration'
import useEOScripts from './hooks/useEOScripts'

import EditorToolbar from './components/EditorToolbar'
import MonacoEditorPane from './components/MonacoEditorPane'
import NewScriptDialog from './components/NewScriptDialog'
import GeometryVariablesPanel from './components/GeometryVariablesPanel'
import ScriptOutput from './components/ScriptOutput'

export default function EditorPanel() {
  const router = useRouter()
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(localStorageConstants.accessTokenKey) : null
  const { organizationId, taskId, projectId } = router.query

  const [code, setCode] = useState('')

  const { editorRef, monacoRef, handleEditorDidMount } = useMonacoEditor()
  const patchPreview = usePatchPreview({ editorRef, monacoRef, setCode })
  const scripts = useEOScripts({ organizationId, projectId, taskId, token, editorRef, code, setCode })

  const eoScriptsRef = useRef(scripts)
  eoScriptsRef.current = scripts

  useEditorToolsRegistration({ editorRef, monacoRef, setCode, eoScriptsRef, ...patchPreview })


  // Keep the shared ref pointing to the latest handleKeepAll so ChatPanel
  // can invoke it without prop drilling (e.g. auto-accept before context capture).
  keepAllRef.current = patchPreview.handleKeepAll

  return (
    <div className='eo-ed'>
      <EditorToolbar
        currentScriptName={scripts.currentScriptName}
        hasUnsavedChanges={scripts.hasUnsavedChanges}
        distinctScripts={scripts.distinctScripts}
        currentScriptVersions={scripts.currentScriptVersions}
        currentVersion={scripts.currentVersion}
        currentVersionId={scripts.currentVersionId}
        isFirstScript={scripts.isFirstScript}
        onSelectScript={scripts.handleSelectScript}
        onSelectVersion={scripts.handleSelectVersion}
        onOpenNewScriptDialog={scripts.handleOpenNewScriptDialog}
        createEOScriptLoading={scripts.createEOScriptLoading}
        hasPendingChange={patchPreview.hasPendingChange}
        onSave={scripts.handleSave}
        onKeepAll={patchPreview.handleKeepAll}
        onUndoAll={patchPreview.handleUndoAll}
        code={code}
        editorRef={editorRef}
        organizationId={organizationId}
        projectId={projectId}
        taskId={taskId}
        token={token}
      />

      <GeometryVariablesPanel />

      <MonacoEditorPane
        code={code}
        latestEOScriptLoading={scripts.latestEOScriptLoading}
        isFirstScript={scripts.isFirstScript}
        newScriptNameInput={scripts.newScriptNameInput}
        setNewScriptNameInput={scripts.setNewScriptNameInput}
        onCreateNewScript={scripts.handleCreateNewScript}
        onChange={patchPreview.onChange}
        onMount={handleEditorDidMount}
      />

      <ScriptOutput />

      <NewScriptDialog
        open={scripts.newScriptDialogOpen}
        onClose={() => scripts.setNewScriptDialogOpen(false)}
        newScriptNameInput={scripts.newScriptNameInput}
        setNewScriptNameInput={scripts.setNewScriptNameInput}
        onCreateNewScript={scripts.handleCreateNewScript}
      />
    </div>
  )
}
