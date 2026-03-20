import { memo } from 'react'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import MapPanel from '../panels/map/MapPanel'
import ChatPanel from '../panels/chat/ChatPanel'
import EditorPanel from '../panels/editor/EditorPanel'

import PanelFrame from './PanelFrame'
import SplitterX from './SplitterX'
import SplitterY from './SplitterY'
import useWorkspaceLayout from './hooks/useWorkspaceLayout'

// Memoize heavy panels so layout state changes do not force them to re-render.
const MemoMapPanel = memo(MapPanel)
const MemoChatPanel = memo(ChatPanel)
const MemoEditorPanel = memo(EditorPanel)

// =============================================================================
// All three panels are ALWAYS mounted at fixed positions in the tree.
// Layout mode changes drive CSS only — they never unmount/remount panels.
// This preserves panel state (map position, editor content, chat history)
// across every minimize / maximize / restore interaction.
// =============================================================================
export default function WorkspaceGrid() {
  const theme = useTheme()
  // Below md (900 px) switch to a stacked mobile layout:
  //  • column-only (no horizontal split)
  //  • SplitterX hidden (no left/right dragging)
  //  • Map gets a percentage-based height rather than a splitX fraction
  //  • Desktop min-width constraints are removed so the layout doesn't overflow
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const {
    layoutMode,
    splitX,
    splitY,
    chatMin,
    editorMin,
    mapMin,
    rootRef,
    rightRef,
    dragX,
    dragY,
    actions,
    LAYOUT,
    LINE_H,
    MAP_MIN_W,
    RIGHT_MIN_W,
    CHAT_MIN_H,
    EDITOR_MIN_H
  } = useWorkspaceLayout()

  // ── Mode booleans ──────────────────────────────────────────────────────────
  const isDefault = layoutMode === LAYOUT.DEFAULT
  const isMapMax = layoutMode === LAYOUT.MAP_MAX
  const isMapMin = layoutMode === LAYOUT.MAP_MIN
  const isChatMax = layoutMode === LAYOUT.CHAT_MAX
  const isEditorMax = layoutMode === LAYOUT.EDITOR_MAX

  // Panels forced to a collapsed line by the layout mode (independent of their own min flag).
  const editorForcedLine = isMapMax || isChatMax
  const chatForcedLine = isMapMax || isEditorMax

  // Effective collapsed state for each panel
  const editorCollapsed = editorMin || editorForcedLine
  const chatCollapsed = chatMin || chatForcedLine

  // isMaximized — panel fills its container; Minimize is hidden, Restore is shown
  const isEditorMaximized = isEditorMax && !editorMin
  const isChatMaximized = isChatMax && !chatMin

  // ── Restore actions — right action per panel per mode ─────────────────────
  const mapRestoreAction = isMapMax
    ? actions.map.onRestoreFromMax // exit MAP_MAX → DEFAULT
    : actions.map.onRestore // unset mapMin

  const editorRestoreAction =
    isEditorMax && editorMin
      ? actions.editor.onRestoreFromMaxAndUnmin // exit EDITOR_MAX + unmin atomically
      : isEditorMax || editorForcedLine
      ? actions.editor.onRestoreFromMax // exit to DEFAULT
      : actions.editor.onRestore // unset editorMin (DEFAULT)

  const chatRestoreAction =
    isChatMax && chatMin
      ? actions.chat.onRestoreFromMaxAndUnmin // exit CHAT_MAX + unmin atomically
      : isChatMax || chatForcedLine
      ? actions.chat.onRestoreFromMax // exit to DEFAULT
      : actions.chat.onRestore // unset chatMin (DEFAULT)

  // ── Splitter visibility ────────────────────────────────────────────────────
  const allRightMin = editorCollapsed && chatCollapsed
  // SplitterX is hidden on mobile — no horizontal drag in stacked layout
  const showSplitterX = !isMobile && !isMapMax && !isMapMin && !mapMin && !allRightMin
  const showSplitterY = isDefault && !editorMin && !chatMin

  // ── Outer flex direction ───────────────────────────────────────────────────
  // Mobile always stacks vertically; desktop switches on specific conditions
  const useColOuter = isMobile || isMapMax || isMapMin || mapMin || (isDefault && allRightMin)

  // ── Shared stretch base for panel wrapper boxes ────────────────────────────
  const sb = { display: 'flex', alignItems: 'stretch', '& > *': { flex: 1, width: '100%', minWidth: 0 } }

  // ── Map box sx ─────────────────────────────────────────────────────────────
  const mapBoxSx = (() => {
    if (isMapMax) return { ...sb, flex: 1, minHeight: 0 }
    if (mapMin || isMapMin) return { ...sb, minHeight: LINE_H, height: LINE_H, flexShrink: 0 }
    // Mobile: map takes 40% of the column height; right column fills the rest
    if (isMobile) return { ...sb, flexBasis: '40%', flexGrow: 0, flexShrink: 0, minHeight: 0 }
    if (useColOuter) return { ...sb, flex: 1, minHeight: 0 } // DEFAULT + allRightMin: map expands
    return { ...sb, minWidth: MAP_MIN_W, minHeight: 0, flexBasis: `${splitX * 100}%`, flexGrow: 0, flexShrink: 0 }
  })()

  // ── Right column box sx ────────────────────────────────────────────────────
  const rightBoxSx = (() => {
    if (isMapMax) {
      return { display: 'flex', flexDirection: 'column', gap: 1 }
    }
    if (isMapMin) {
      return { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 1.5 }
    }
    if (allRightMin && isDefault) {
      return {
        minWidth: (isMobile || mapMin) ? 'auto' : RIGHT_MIN_W,
        minHeight: LINE_H * 2 + 8,
        height: LINE_H * 2 + 8,
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }
    }
    return {
      // On mobile, drop the desktop min-width so the column never overflows the screen
      minWidth: (isMobile || mapMin) ? 'auto' : RIGHT_MIN_W,
      minHeight: 0,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5
    }
  })()

  // ── Editor box sx ──────────────────────────────────────────────────────────
  const editorBoxSx = (() => {
    if (isMapMin) return { ...sb, minHeight: editorMin ? LINE_H : EDITOR_MIN_H }
    if (editorForcedLine || (isEditorMax && editorMin))
      return { ...sb, minHeight: LINE_H, height: LINE_H, flexShrink: 0 }
    if (isEditorMax) return { ...sb, flex: 1, minHeight: 0 }
    // DEFAULT
    if (editorMin) return { ...sb, minHeight: LINE_H, height: LINE_H, flexBasis: LINE_H, flexGrow: 0, flexShrink: 0 }
    if (chatMin) return { ...sb, flex: 1, minHeight: EDITOR_MIN_H }
    return { ...sb, minHeight: EDITOR_MIN_H, flexBasis: `${splitY * 100}%`, flexGrow: 0, flexShrink: 0 }
  })()

  // ── Chat box sx ────────────────────────────────────────────────────────────
  const chatBoxSx = (() => {
    if (isMapMin) return { ...sb, minHeight: chatMin ? LINE_H : CHAT_MIN_H }
    if (chatForcedLine || (isChatMax && chatMin)) return { ...sb, minHeight: LINE_H, height: LINE_H, flexShrink: 0 }
    if (isChatMax) return { ...sb, flex: 1, minHeight: 0 }
    // DEFAULT
    if (chatMin)
      return { ...sb, minHeight: LINE_H, height: LINE_H, flexBasis: LINE_H, flexGrow: 0, flexShrink: 0, minWidth: 0 }
    return { ...sb, minHeight: CHAT_MIN_H, flex: 1, minWidth: 0 }
  })()

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box
      ref={rootRef}
      sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: useColOuter ? 'column' : 'row', gap: 1.5 }}
    >
      {/* Map panel — always mounted at this tree position */}
      <Box sx={mapBoxSx}>
        <PanelFrame
          title='Map'
          collapsed={mapMin}
          isMaximized={isMapMax}
          onMaximize={actions.map.onMaximize}
          onMinimize={actions.map.onMinimize}
          onRestore={mapRestoreAction}
        >
          <MemoMapPanel />
        </PanelFrame>
      </Box>

      {showSplitterX && <SplitterX onDrag={dragX} />}

      {/* Right column — always mounted */}
      <Box ref={rightRef} sx={rightBoxSx}>
        {/* Editor panel — always mounted at this tree position */}
        <Box sx={editorBoxSx}>
          <PanelFrame
            title='Editor'
            collapsed={editorCollapsed}
            isMaximized={isEditorMaximized}
            onMaximize={actions.editor.onMaximize}
            onMinimize={actions.editor.onMinimize}
            onRestore={editorRestoreAction}
          >
            <MemoEditorPanel />
          </PanelFrame>
        </Box>

        {showSplitterY && <SplitterY onDrag={dragY} />}

        {/* Chat panel — always mounted at this tree position */}
        <Box sx={chatBoxSx}>
          <PanelFrame
            title='Chat'
            collapsed={chatCollapsed}
            isMaximized={isChatMaximized}
            onMaximize={actions.chat.onMaximize}
            onMinimize={actions.chat.onMinimize}
            onRestore={chatRestoreAction}
          >
            <MemoChatPanel />
          </PanelFrame>
        </Box>
      </Box>
    </Box>
  )
}
