import ScriptSelectorMenu from './ScriptSelectorMenu'
import VersionSelectorMenu from './VersionSelectorMenu'
import SaveActions from './SaveActions'
import GeeRunner from '../../../gee/GeeRunner'

/** script › version, then the assistant's change, Save and Run */
export default function EditorToolbar({
  currentScriptName,
  hasUnsavedChanges,
  distinctScripts,
  currentScriptVersions,
  currentVersion,
  currentVersionId,
  isFirstScript,
  onSelectScript,
  onSelectVersion,
  onOpenNewScriptDialog,
  createEOScriptLoading,
  hasPendingChange,
  onSave,
  onKeepAll,
  onUndoAll,
  code,
  editorRef,
  organizationId,
  projectId,
  taskId,
  token
}) {
  return (
    <div className='eo-bar'>
      <ScriptSelectorMenu
        currentScriptName={currentScriptName}
        hasUnsavedChanges={hasUnsavedChanges}
        distinctScripts={distinctScripts}
        isFirstScript={isFirstScript}
        onSelectScript={onSelectScript}
        onOpenNewScriptDialog={onOpenNewScriptDialog}
      />
      <VersionSelectorMenu
        currentScriptVersions={currentScriptVersions}
        currentVersion={currentVersion}
        currentVersionId={currentVersionId}
        onSelectVersion={onSelectVersion}
      />
      <span className='sp' />
      {!isFirstScript && (
        <SaveActions
          createEOScriptLoading={createEOScriptLoading}
          hasUnsavedChanges={hasUnsavedChanges}
          hasPendingChange={hasPendingChange}
          onSave={onSave}
          onKeepAll={onKeepAll}
          onUndoAll={onUndoAll}
        />
      )}
      <GeeRunner
        code={code}
        getCurrentCode={() => editorRef.current?.getValue?.() ?? code}
        organizationId={organizationId}
        projectId={projectId}
        taskId={taskId}
        token={token}
        scriptName={currentScriptName}
        isFirstScript={isFirstScript}
      />
    </div>
  )
}
