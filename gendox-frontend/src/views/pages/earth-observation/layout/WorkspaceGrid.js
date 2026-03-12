import Box from '@mui/material/Box'

import MapPanel from '../panels/map/MapPanel'
import ChatPanel from '../panels/chat/ChatPanel'
import EditorPanel from '../panels/editor/EditorPanel'

import PanelFrame from './PanelFrame'
import PanelLine from './PanelLine'
import SplitterX from './SplitterX'
import SplitterY from './SplitterY'
import useWorkspaceLayout from './hooks/useWorkspaceLayout'

export default function WorkspaceGrid() {
  const {
    layoutMode,
    splitX,
    splitY,
    chatMin,
    editorMin,
    mapMin,
    canShowYSplitter,
    allRightMinimized,
    useColumnLayout,
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

  // =================================================================
  // MODE: MAP_MAX  -> Map full + bottom 2 lines (Chat/Editor)
  // =================================================================
  if (layoutMode === LAYOUT.MAP_MAX) {
    return (
      <Box ref={rootRef} sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'stretch',
            '& > *': { flex: 1, width: '100%', minWidth: 0 }
          }}
        >
          <PanelFrame
            title='Map'
            collapsed={mapMin}
            isMaximized={true}
            onMinimize={actions.map.onMinimize}
            onRestore={actions.map.onRestoreFromMax}
            onMaximize={actions.map.onMaximize}
          >
            <MapPanel />
          </PanelFrame>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <PanelLine
            title='Chat'
            onClick={actions.chat.onMaximize}
            onMaximize={actions.chat.onMaximize}
            onRestore={actions.chat.onRestoreFromMax}
          />
          <PanelLine
            title='Editor'
            onClick={actions.editor.onMaximize}
            onMaximize={actions.editor.onMaximize}
            onRestore={actions.editor.onRestoreFromMax}
          />
        </Box>
      </Box>
    )
  }

  // =================================================================
  // MODE: MAP_MIN  -> Map line top + Chat/Editor side-by-side
  // =================================================================
  if (layoutMode === LAYOUT.MAP_MIN) {
    return (
      <Box ref={rootRef} sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box
          sx={{
            minHeight: `${LINE_H}px`,
            display: 'flex',
            alignItems: 'stretch',
            '& > *': { flex: 1, width: '100%', minWidth: 0 }
          }}
        >
          <PanelFrame
            title='Map'
            collapsed={mapMin}
            isMaximized={false}
            onMinimize={actions.map.onMinimize}
            onRestore={actions.map.onRestore}
            onMaximize={actions.map.onMaximize}
          >
            <MapPanel />
          </PanelFrame>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 1.5
          }}
        >
          <PanelFrame
            title='Chat'
            collapsed={chatMin}
            isMaximized={false}
            onMaximize={actions.chat.onMaximize}
            onMinimize={actions.chat.onMinimize}
            onRestore={actions.chat.onRestore}
          >
            <ChatPanel />
          </PanelFrame>

          <PanelFrame
            title='Editor'
            collapsed={editorMin}
            isMaximized={false}
            onMaximize={actions.editor.onMaximize}
            onMinimize={actions.editor.onMinimize}
            onRestore={actions.editor.onRestore}
          >
            <EditorPanel />
          </PanelFrame>
        </Box>
      </Box>
    )
  }

  // =================================================================
  // MODE: CHAT_MAX -> Map left (resizable) + Chat big right + Editor line
  // =================================================================
  if (layoutMode === LAYOUT.CHAT_MAX) {
    return (
      <Box ref={rootRef} sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: mapMin ? 'column' : 'row', gap: 1.5 }}>
        <Box
          sx={{
            minWidth: mapMin ? 'auto' : `${MAP_MIN_W}px`,
            minHeight: mapMin ? `${LINE_H}px` : 0,
            display: 'flex',
            flexBasis: `${splitX * 100}%`,
            flexGrow: 0,
            flexShrink: 0,
            alignItems: 'stretch',
            '& > *': { flex: 1, width: '100%', minWidth: 0 }
          }}
        >
          <PanelFrame
            title='Map'
            collapsed={mapMin}
            isMaximized={false}
            onMaximize={actions.map.onMaximize}
            onMinimize={actions.map.onMinimize}
            onRestore={actions.map.onRestore}
          >
            <MapPanel />
          </PanelFrame>
        </Box>

        {!mapMin && <SplitterX onDrag={dragX} />}

        <Box
          ref={rightRef}
          sx={{
            minWidth: mapMin ? 'auto' : `${RIGHT_MIN_W}px`,
            minHeight: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5
          }}
        >
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              alignItems: 'stretch',
              '& > *': { flex: 1, width: '100%', minWidth: 0 }
            }}
          >
            {chatMin ? (
              <PanelLine
                title='Chat'
                onClick={actions.chat.onRestore}
                onMaximize={actions.chat.onMaximize}
                onRestore={() => { actions.chat.onRestore(); actions.chat.onRestoreFromMax() }}
              />
            ) : (
              <PanelFrame
                title='Chat'
                collapsed={false}
                isMaximized={true}
                onMinimize={actions.chat.onMinimize}
                onRestore={actions.chat.onRestoreFromMax}
                onMaximize={actions.chat.onMaximize}
              >
                <ChatPanel />
              </PanelFrame>
            )}
          </Box>

          <PanelLine
            title='Editor'
            onClick={() => editorMin ? (actions.editor.onRestore(), actions.editor.onRestoreFromMax()) : actions.editor.onMaximize()}
            onMaximize={actions.editor.onMaximize}
            onRestore={actions.editor.onRestoreFromMax}
          />
        </Box>
      </Box>
    )
  }

  // =================================================================
  // MODE: EDITOR_MAX -> Map left (resizable) + Editor big right + Chat line
  // =================================================================
  if (layoutMode === LAYOUT.EDITOR_MAX) {
    return (
      <Box ref={rootRef} sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: mapMin ? 'column' : 'row', gap: 1.5 }}>
        <Box
          sx={{
            minWidth: mapMin ? 'auto' : `${MAP_MIN_W}px`,
            minHeight: mapMin ? `${LINE_H}px` : 0,
            display: 'flex',
            flexBasis: `${splitX * 100}%`,
            flexGrow: 0,
            flexShrink: 0,
            alignItems: 'stretch',
            '& > *': { flex: 1, width: '100%', minWidth: 0 }
          }}
        >
          <PanelFrame
            title='Map'
            collapsed={mapMin}
            isMaximized={false}
            onMaximize={actions.map.onMaximize}
            onMinimize={actions.map.onMinimize}
            onRestore={actions.map.onRestore}
          >
            <MapPanel />
          </PanelFrame>
        </Box>

        {!mapMin && <SplitterX onDrag={dragX} />}

        <Box
          ref={rightRef}
          sx={{
            minWidth: mapMin ? 'auto' : `${RIGHT_MIN_W}px`,
            minHeight: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5
          }}
        >
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              alignItems: 'stretch',
              '& > *': { flex: 1, width: '100%', minWidth: 0 }
            }}
          >
            {editorMin ? (
              <PanelLine
                title='Editor'
                onClick={actions.editor.onRestore}
                onMaximize={actions.editor.onMaximize}
                onRestore={() => { actions.editor.onRestore(); actions.editor.onRestoreFromMax() }}
              />
            ) : (
              <PanelFrame
                title='Editor'
                collapsed={false}
                isMaximized={true}
                onMinimize={actions.editor.onMinimize}
                onRestore={actions.editor.onRestoreFromMax}
                onMaximize={actions.editor.onMaximize}
              >
                <EditorPanel />
              </PanelFrame>
            )}
          </Box>

          <PanelLine
            title='Chat'
            onClick={() => chatMin ? (actions.chat.onRestore(), actions.chat.onRestoreFromMax()) : actions.chat.onMaximize()}
            onMaximize={actions.chat.onMaximize}
            onRestore={actions.chat.onRestoreFromMax}
          />
        </Box>
      </Box>
    )
  }

  // =================================================================
  // MODE: DEFAULT -> Resizable Map vs Right + Resizable Chat vs Editor
  // =================================================================
  return (
    <Box ref={rootRef} sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: useColumnLayout ? 'column' : 'row', gap: 1.5 }}>
      {/* Map */}
      <Box
        sx={{
          minWidth: mapMin ? 'auto' : `${MAP_MIN_W}px`,
          minHeight: mapMin ? `${LINE_H}px` : 0,
          display: 'flex',
          flexBasis: mapMin ? 'auto' : allRightMinimized ? 'auto' : `${splitX * 100}%`,
          flexGrow: mapMin ? 0 : allRightMinimized ? 1 : 0,
          flexShrink: allRightMinimized ? 1 : 0,
          alignItems: 'stretch',
          '& > *': { flex: 1, width: '100%', minWidth: 0 }
        }}
      >
        <PanelFrame
          title='Map'
          collapsed={mapMin}
          isMaximized={false}
          onMaximize={actions.map.onMaximize}
          onMinimize={actions.map.onMinimize}
          onRestore={actions.map.onRestore}
        >
          <MapPanel />
        </PanelFrame>
      </Box>

      {!useColumnLayout && <SplitterX onDrag={dragX} />}

      {/* Right column */}
      <Box
        ref={rightRef}
        sx={{
          minWidth: mapMin ? 'auto' : `${RIGHT_MIN_W}px`,
          minHeight: allRightMinimized ? `${LINE_H * 2 + 8}px` : 0,
          height: allRightMinimized ? `${LINE_H * 2 + 8}px` : 'auto',
          flex: allRightMinimized ? '0 0 auto' : 1,
          display: 'flex',
          flexDirection: 'column',
          gap: allRightMinimized ? 1 : 1.5
        }}
      >
        {/* Editor */}
        <Box
          sx={{
            minHeight: editorMin ? LINE_H : `${EDITOR_MIN_H}px`,
            height: editorMin ? LINE_H : 'auto',
            display: 'flex',
            flexBasis: editorMin ? LINE_H : chatMin ? 'auto' : `${splitY * 100}%`,
            flexGrow: chatMin ? 1 : 0,
            flexShrink: 0,
            alignItems: 'stretch',
            '& > *': { flex: 1, width: '100%', minWidth: 0 }
          }}
        >
          <PanelFrame
            title='Editor'
            collapsed={editorMin}
            isMaximized={false}
            onMaximize={actions.editor.onMaximize}
            onMinimize={actions.editor.onMinimize}
            onRestore={actions.editor.onRestore}
          >
            <EditorPanel />
          </PanelFrame>
        </Box>

        {canShowYSplitter && <SplitterY onDrag={dragY} />}

        {/* Chat */}
        <Box
          sx={{
            minHeight: chatMin ? LINE_H : `${CHAT_MIN_H}px`,
            height: chatMin ? LINE_H : 'auto',
            display: 'flex',
            flexBasis: chatMin ? LINE_H : 'auto',
            flexGrow: 1,
            flexShrink: 1,
            minWidth: 0,
            alignItems: 'stretch',
            '& > *': { flex: 1, width: '100%', minWidth: 0 }
          }}
        >
          <PanelFrame
            title='Chat'
            collapsed={chatMin}
            isMaximized={false}
            onMaximize={actions.chat.onMaximize}
            onMinimize={actions.chat.onMinimize}
            onRestore={actions.chat.onRestore}
          >
            <ChatPanel />
          </PanelFrame>
        </Box>
      </Box>
    </Box>
  )
}
