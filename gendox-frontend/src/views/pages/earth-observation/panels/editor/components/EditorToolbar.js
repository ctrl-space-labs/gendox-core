import Stack from '@mui/material/Stack'

import ScriptSelectorMenu from './ScriptSelectorMenu'
import VersionSelectorMenu from './VersionSelectorMenu'
import SaveActions from './SaveActions'
import GeeRunner from '../../../gee/GeeRunner'

export default function EditorToolbar({
  // script context
  currentScriptName,
  hasUnsavedChanges,
  distinctScripts,
  currentScriptVersions,
  currentVersion,
  currentVersionId,
  scriptMenuAnchor,
  setScriptMenuAnchor,
  versionMenuAnchor,
  setVersionMenuAnchor,
  isFirstScript,
  onSelectScript,
  onSelectVersion,
  onOpenNewScriptDialog,
  // save / patch actions
  createEOScriptLoading,
  hasPendingChange,
  onSave,
  onKeepAll,
  onUndoAll,
  // GeeRunner
  code,
  editorRef,
  organizationId,
  projectId,
  taskId,
  token
}) {
  return (
    <Stack
      direction='row'
      alignItems='center'
      sx={{
        px: 1,
        minHeight: 40,
        borderBottom: '1px solid',
        borderColor: 'divider',
        gap: 0.5,
        flexShrink: 0
      }}
    >
      {/* Left: script context (name → version breadcrumb) */}
      <Stack direction='row' alignItems='center' gap={0.25} sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <ScriptSelectorMenu
          currentScriptName={currentScriptName}
          hasUnsavedChanges={hasUnsavedChanges}
          distinctScripts={distinctScripts}
          scriptMenuAnchor={scriptMenuAnchor}
          setScriptMenuAnchor={setScriptMenuAnchor}
          isFirstScript={isFirstScript}
          onSelectScript={onSelectScript}
          onOpenNewScriptDialog={onOpenNewScriptDialog}
        />
        <VersionSelectorMenu
          currentScriptVersions={currentScriptVersions}
          currentVersion={currentVersion}
          currentVersionId={currentVersionId}
          versionMenuAnchor={versionMenuAnchor}
          setVersionMenuAnchor={setVersionMenuAnchor}
          onSelectVersion={onSelectVersion}
        />
      </Stack>

      {/* Right: actions */}
      <Stack direction='row' alignItems='center' gap={0.5} sx={{ flexShrink: 0 }}>
        <SaveActions
          createEOScriptLoading={createEOScriptLoading}
          hasUnsavedChanges={hasUnsavedChanges}
          hasPendingChange={hasPendingChange}
          onSave={onSave}
          onKeepAll={onKeepAll}
          onUndoAll={onUndoAll}
        />
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
      </Stack>
    </Stack>
  )
}
