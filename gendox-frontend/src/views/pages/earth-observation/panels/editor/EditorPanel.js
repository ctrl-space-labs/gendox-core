import { useState, useRef } from 'react'
import Box from '@mui/material/Box'
import { useRouter } from 'next/router'

import { useAuth } from 'src/authentication/useAuth'
import { keepAllRef } from 'src/views/pages/earth-observation/panels/shared/panelState'

import useMonacoEditor from './hooks/useMonacoEditor'
import usePatchPreview from './hooks/usePatchPreview'
import useEditorToolsRegistration from './hooks/useEditorToolsRegistration'
import useEOScripts from './hooks/useEOScripts'

import EditorToolbar from './components/EditorToolbar'
import MonacoEditorPane from './components/MonacoEditorPane'
import NewScriptDialog from './components/NewScriptDialog'

export default function EditorPanel() {
  const router = useRouter()
  const { oidcAuthState } = useAuth()
  const token = oidcAuthState?.user?.access_token
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
    <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <EditorToolbar
        currentScriptName={scripts.currentScriptName}
        hasUnsavedChanges={scripts.hasUnsavedChanges}
        distinctScripts={scripts.distinctScripts}
        currentScriptVersions={scripts.currentScriptVersions}
        currentVersion={scripts.currentVersion}
        currentVersionId={scripts.currentVersionId}
        scriptMenuAnchor={scripts.scriptMenuAnchor}
        setScriptMenuAnchor={scripts.setScriptMenuAnchor}
        versionMenuAnchor={scripts.versionMenuAnchor}
        setVersionMenuAnchor={scripts.setVersionMenuAnchor}
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

      <NewScriptDialog
        open={scripts.newScriptDialogOpen}
        onClose={() => scripts.setNewScriptDialogOpen(false)}
        newScriptNameInput={scripts.newScriptNameInput}
        setNewScriptNameInput={scripts.setNewScriptNameInput}
        onCreateNewScript={scripts.handleCreateNewScript}
      />
    </Box>
  )
}
