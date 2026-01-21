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
  restoreDefault,
  setSplitX,
  setSplitY,
  minimizeChat,
  restoreChat,
  minimizeEditor,
  restoreEditor
} from 'src/store/seaScope/seaScope'

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
  const { layoutMode, splitX, splitY, chatMin, editorMin } = useSelector(s => s.seaScope)

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
            onMinimize={() => dispatch(minimizeMap())}
            onRestore={() => dispatch(restoreDefault())}
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
  // =================================================================
  if (layoutMode === LAYOUT.MAP_MIN) {
    return (
      <Box ref={rootRef} sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <PanelLine
          title='Map'
          onClick={() => dispatch(restoreDefault())}
          onRestore={() => dispatch(restoreDefault())}
          onMaximize={() => dispatch(maximizeMap())}
        />

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 1.5
          }}
        >
          {chatMin ? (
            <PanelLine
              title='Chat'
              onClick={() => dispatch(restoreChat())}
              onRestore={() => dispatch(restoreChat())}
              onMaximize={() => dispatch(maximizeChat())}
            />
          ) : (
            <PanelFrame
              title='Chat'
              onMaximize={() => dispatch(maximizeChat())}
              onMinimize={() => dispatch(minimizeChat())}
            >
              <ChatPanel />
            </PanelFrame>
          )}

          {editorMin ? (
            <PanelLine
              title='Editor'
              onClick={() => dispatch(restoreEditor())}
              onRestore={() => dispatch(restoreEditor())}
              onMaximize={() => dispatch(maximizeEditor())}
            />
          ) : (
            <PanelFrame
              title='Editor'
              onMaximize={() => dispatch(maximizeEditor())}
              onMinimize={() => dispatch(minimizeEditor())}
            >
              <EditorPanel />
            </PanelFrame>
          )}
        </Box>
      </Box>
    )
  }

  // =================================================================
  // MODE: CHAT_MAX -> Map left (resizable) + Chat big right + Editor line
  // =================================================================
  if (layoutMode === LAYOUT.CHAT_MAX) {
    return (
      <Box ref={rootRef} sx={{ height: '100%', minHeight: 0, display: 'flex', gap: 1.5 }}>
        {/* Map left */}
        <Box
          sx={{
            minWidth: `${MAP_MIN_W}px`,
            minHeight: 0,
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
          <PanelFrame title='Map' onMaximize={() => dispatch(maximizeMap())} onMinimize={() => dispatch(minimizeMap())}>
            <MapPanel />
          </PanelFrame>
        </Box>

        <SplitterX onDrag={dragX} />

        {/* Right */}
        <Box
          ref={rightRef}
          sx={{
            minWidth: `${RIGHT_MIN_W}px`,
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
                onMinimize={() => dispatch(minimizeChat())}
                onRestore={() => dispatch(restoreDefault())}
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
      <Box ref={rootRef} sx={{ height: '100%', minHeight: 0, display: 'flex', gap: 1.5 }}>
        {/* Map left */}
        <Box
          sx={{
            minWidth: `${MAP_MIN_W}px`,
            minHeight: 0,
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
          <PanelFrame title='Map' onMaximize={() => dispatch(maximizeMap())} onMinimize={() => dispatch(minimizeMap())}>
            <MapPanel />
          </PanelFrame>
        </Box>

        <SplitterX onDrag={dragX} />

        {/* Right */}
        <Box
          ref={rightRef}
          sx={{
            minWidth: `${RIGHT_MIN_W}px`,
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
                onMinimize={() => dispatch(minimizeEditor())}
                onRestore={() => dispatch(restoreDefault())}
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
  return (
    <Box ref={rootRef} sx={{ height: '100%', minHeight: 0, display: 'flex', gap: 1.5 }}>
      {/* Map */}
      <Box
        sx={{
          minWidth: `${MAP_MIN_W}px`,
          minHeight: 0,
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
        <PanelFrame title='Map' onMaximize={() => dispatch(maximizeMap())} onMinimize={() => dispatch(minimizeMap())}>
          <MapPanel />
        </PanelFrame>
      </Box>

      <SplitterX onDrag={dragX} />

      {/* Right column */}
      <Box
        ref={rightRef}
        sx={{
          minWidth: `${RIGHT_MIN_W}px`,
          minHeight: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5
        }}
      >
        {/* Chat */}
        <Box
          sx={{
            minHeight: chatMin ? LINE_H : `${CHAT_MIN_H}px`,
            display: 'flex',
            flexBasis: chatMin ? LINE_H : `${splitY * 100}%`,
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
          {chatMin ? (
            <PanelLine
              title='Chat'
              onClick={() => dispatch(restoreChat())}
              onRestore={() => dispatch(restoreChat())}
              onMaximize={() => dispatch(maximizeChat())}
            />
          ) : (
            <PanelFrame
              title='Chat'
              onMaximize={() => dispatch(maximizeChat())}
              onMinimize={() => dispatch(minimizeChat())}
            >
              <ChatPanel />
            </PanelFrame>
          )}
        </Box>

        {canShowYSplitter && <SplitterY onDrag={dragY} />}

        {/* Editor */}
        <Box
          sx={{
            minHeight: editorMin ? LINE_H : `${EDITOR_MIN_H}px`,
            display: 'flex',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
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
              onRestore={() => dispatch(restoreEditor())}
              onMaximize={() => dispatch(maximizeEditor())}
            />
          ) : (
            <PanelFrame
              title='Editor'
              onMaximize={() => dispatch(maximizeEditor())}
              onMinimize={() => dispatch(minimizeEditor())}
            >
              <EditorPanel />
            </PanelFrame>
          )}
        </Box>
      </Box>
    </Box>
  )
}
