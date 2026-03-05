import { useEffect, useMemo, useRef } from 'react'
import Box from '@mui/material/Box'
import { useDispatch, useSelector } from 'react-redux'

import MapPanel from '../panels/map/MapPanel'
import ChatPanel from '../panels/chat/ChatPanel'
import EditorPanel from '../panels/editor/EditorPanel'

import PanelFrame from '../components/PanelFrame'
import PanelLine from '../components/PanelLine'
import SplitterX from './SplitterX'
import SplitterY from './SplitterY'

import {
  LAYOUT,
  maximizeMap,
  maximizeChat,
  maximizeEditor,
  minimizeMap,
  restoreMap,
  restoreDefault,
  setSplitX,
  setSplitY,
  minimizeChat,
  restoreChat,
  minimizeEditor,
  restoreEditor
} from 'src/store/earthObservation/earthObservation'

// -------------------- MINIMUM SIZES (τύπου screenshot)
const LINE_H = 34

const MAP_MIN_W = 560 // min width map
const RIGHT_MIN_W = 460 // min width right column

const CHAT_MIN_H = 220 // min height chat
const EDITOR_MIN_H = 220 // min height editor

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

const clampSplitX = (ratio, totalW) => {
  // map min + right min
  const min = MAP_MIN_W / totalW
  const max = 1 - RIGHT_MIN_W / totalW
  return clamp(ratio, min, max)
}

const clampSplitY = (ratio, totalH) => {
  const min = CHAT_MIN_H / totalH
  const max = 1 - EDITOR_MIN_H / totalH
  return clamp(ratio, min, max)
}

export default function WorkspaceGrid() {
  const dispatch = useDispatch()
  const { layoutMode, splitX, splitY, chatMin, editorMin, mapMin } = useSelector(s => s.earthObservation)

  const rootRef = useRef(null)
  const rightRef = useRef(null)

  const canShowYSplitter = useMemo(() => !chatMin && !editorMin, [chatMin, editorMin])

  useEffect(() => {
    const w = rootRef.current?.clientWidth || window.innerWidth
    const h = rightRef.current?.clientHeight || window.innerHeight

    // Start with the current stored ratios but clamp them to respect min sizes.
    dispatch(setSplitX(clampSplitX(splitX, w)))
    dispatch(setSplitY(clampSplitY(splitY, h)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Drag handlers με clamp βάση px
  const dragX = dx => {
    const w = rootRef.current?.clientWidth || window.innerWidth
    const next = splitX + dx / w
    dispatch(setSplitX(clampSplitX(next, w)))
  }

  const dragY = dy => {
    const h = rightRef.current?.clientHeight || window.innerHeight
    const next = splitY + dy / h
    dispatch(setSplitY(clampSplitY(next, h)))
  }

  // =================================================================
  // MODE: MAP_MAX  -> Map full + κάτω 2 lines (Chat/Editor)
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
            '& > *': {
              flex: 1,
              width: '100%',
              minWidth: 0
            }
          }}
        >
          <PanelFrame
            title='Map'
            collapsed={mapMin}
            isMaximized={layoutMode === LAYOUT.MAP_MAX}
            onMinimize={() => dispatch(minimizeMap())}
            onRestore={() => {
              if (layoutMode === LAYOUT.MAP_MAX) {
                dispatch(restoreDefault())
              } else {
                dispatch(restoreMap())
              }
            }}
            onMaximize={() => dispatch(maximizeMap())}
          >
            <MapPanel />
          </PanelFrame>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <PanelLine
            title='Chat'
            onClick={() => dispatch(maximizeChat())}
            onMaximize={() => dispatch(maximizeChat())}
            onRestore={() => dispatch(restoreDefault())}
          />
          <PanelLine
            title='Editor'
            onClick={() => dispatch(maximizeEditor())}
            onMaximize={() => dispatch(maximizeEditor())}
            onRestore={() => dispatch(restoreDefault())}
          />
        </Box>
      </Box>
    )
  }

  // =================================================================
  // MODE: MAP_MIN  -> Map line πάνω + κάτω Chat/Editor side-by-side
  // Note: This mode is kept for backward compatibility, but mapMin flag
  // is now used to control visibility while keeping MapPanel mounted
  // =================================================================
  if (layoutMode === LAYOUT.MAP_MIN) {
    return (
      <Box ref={rootRef} sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box
          sx={{
            minHeight: `${LINE_H}px`,
            display: 'flex',
            alignItems: 'stretch',
            '& > *': {
              flex: 1,
              width: '100%',
              minWidth: 0
            }
          }}
        >
          <PanelFrame
            title='Map'
            collapsed={mapMin}
            isMaximized={false}
            onMinimize={() => dispatch(minimizeMap())}
            onRestore={() => dispatch(restoreMap())}
            onMaximize={() => dispatch(maximizeMap())}
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
            onMaximize={() => dispatch(maximizeChat())}
            onMinimize={() => dispatch(minimizeChat())}
            onRestore={() => dispatch(restoreChat())}
          >
            <ChatPanel />
          </PanelFrame>

          <PanelFrame
            title='Editor'
            collapsed={editorMin}
            isMaximized={false}
            onMaximize={() => dispatch(maximizeEditor())}
            onMinimize={() => dispatch(minimizeEditor())}
            onRestore={() => dispatch(restoreEditor())}
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
        {/* Map */}
        <Box
          sx={{
            minWidth: mapMin ? 'auto' : `${MAP_MIN_W}px`,
            minHeight: mapMin ? `${LINE_H}px` : 0,
            display: 'flex',
            flexBasis: `${splitX * 100}%`,
            flexGrow: 0,
            flexShrink: 0,
            alignItems: 'stretch',
            '& > *': {
              flex: 1,
              width: '100%',
              minWidth: 0
            }
          }}
        >
          <PanelFrame
            title='Map'
            collapsed={mapMin}
            isMaximized={false}
            onMaximize={() => dispatch(maximizeMap())}
            onMinimize={() => dispatch(minimizeMap())}
            onRestore={() => dispatch(restoreMap())}
          >
            <MapPanel />
          </PanelFrame>
        </Box>

        {!mapMin && <SplitterX onDrag={dragX} />}

        {/* Right */}
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
              '& > *': {
                flex: 1,
                width: '100%',
                minWidth: 0
              }
            }}
          >
            {chatMin ? (
              <PanelLine
                title='Chat'
                onClick={() => dispatch(restoreChat())}
                onMaximize={() => dispatch(maximizeChat())}
                onRestore={() => {
                  dispatch(restoreChat())
                  dispatch(restoreDefault())
                }}
              />
            ) : (
              <PanelFrame
                title='Chat'
                collapsed={chatMin}
                isMaximized={layoutMode === LAYOUT.CHAT_MAX}
                onMinimize={() => dispatch(minimizeChat())}
                onRestore={() => {
                  if (layoutMode === LAYOUT.CHAT_MAX) {
                    dispatch(restoreDefault())
                  } else {
                    dispatch(restoreChat())
                  }
                }}
                onMaximize={() => dispatch(maximizeChat())}
              >
                <ChatPanel />
              </PanelFrame>
            )}
          </Box>

          {/* Editor line (ή restore αν ήταν minimized) */}
          <PanelLine
            title='Editor'
            onClick={() => {
              if (editorMin) {
                dispatch(restoreEditor())
                dispatch(restoreDefault())
              } else {
                dispatch(maximizeEditor())
              }
            }}
            onMaximize={() => dispatch(maximizeEditor())}
            onRestore={() => dispatch(restoreDefault())}
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
        {/* Map */}
        <Box
          sx={{
            minWidth: mapMin ? 'auto' : `${MAP_MIN_W}px`,
            minHeight: mapMin ? `${LINE_H}px` : 0,
            display: 'flex',
            flexBasis: `${splitX * 100}%`,
            flexGrow: 0,
            flexShrink: 0,
            alignItems: 'stretch',
            '& > *': {
              flex: 1,
              width: '100%',
              minWidth: 0
            }
          }}
        >
          <PanelFrame
            title='Map'
            collapsed={mapMin}
            isMaximized={false}
            onMaximize={() => dispatch(maximizeMap())}
            onMinimize={() => dispatch(minimizeMap())}
            onRestore={() => dispatch(restoreMap())}
          >
            <MapPanel />
          </PanelFrame>
        </Box>

        {!mapMin && <SplitterX onDrag={dragX} />}

        {/* Right */}
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
              '& > *': {
                flex: 1,
                width: '100%',
                minWidth: 0
              }
            }}
          >
            {editorMin ? (
              <PanelLine
                title='Editor'
                onClick={() => dispatch(restoreEditor())}
                onMaximize={() => dispatch(maximizeEditor())}
                onRestore={() => {
                  dispatch(restoreEditor())
                  dispatch(restoreDefault())
                }}
              />
            ) : (
              <PanelFrame
                title='Editor'
                collapsed={editorMin}
                isMaximized={layoutMode === LAYOUT.EDITOR_MAX}
                onMinimize={() => dispatch(minimizeEditor())}
                onRestore={() => {
                  if (layoutMode === LAYOUT.EDITOR_MAX) {
                    dispatch(restoreDefault())
                  } else {
                    dispatch(restoreEditor())
                  }
                }}
                onMaximize={() => dispatch(maximizeEditor())}
              >
                <EditorPanel />
              </PanelFrame>
            )}
          </Box>

          {/* Chat line */}
          <PanelLine
            title='Chat'
            onClick={() => {
              if (chatMin) {
                dispatch(restoreChat())
                dispatch(restoreDefault())
              } else {
                dispatch(maximizeChat())
              }
            }}
            onMaximize={() => dispatch(maximizeChat())}
            onRestore={() => dispatch(restoreDefault())}
          />
        </Box>
      </Box>
    )
  }

  // =================================================================
  // MODE: DEFAULT -> Resizable Map vs Right + Resizable Chat vs Editor
  //               + Min lines για Chat/Editor
  // =================================================================
  const allRightMinimized = chatMin && editorMin
  const useColumnLayout = mapMin || allRightMinimized

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
          '& > *': {
            flex: 1,
            width: '100%',
            minWidth: 0
          }
        }}
      >
        <PanelFrame
          title='Map'
          collapsed={mapMin}
          isMaximized={false}
          onMaximize={() => dispatch(maximizeMap())}
          onMinimize={() => dispatch(minimizeMap())}
          onRestore={() => dispatch(restoreMap())}
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
            '& > *': {
              flex: 1,
              width: '100%',
              minWidth: 0
            }
          }}
        >
          <PanelFrame
            title='Editor'
            collapsed={editorMin}
            isMaximized={false}
            onMaximize={() => dispatch(maximizeEditor())}
            onMinimize={() => dispatch(minimizeEditor())}
            onRestore={() => dispatch(restoreEditor())}
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
            flexGrow: editorMin ? 1 : 1,
            flexShrink: 1,
            minWidth: 0,
            alignItems: 'stretch',
            '& > *': {
              flex: 1,
              width: '100%',
              minWidth: 0
            }
          }}
        >
          <PanelFrame
            title='Chat'
            collapsed={chatMin}
            isMaximized={false}
            onMaximize={() => dispatch(maximizeChat())}
            onMinimize={() => dispatch(minimizeChat())}
            onRestore={() => dispatch(restoreChat())}
          >
            <ChatPanel />
          </PanelFrame>
        </Box>
      </Box>
    </Box>
  )
}
