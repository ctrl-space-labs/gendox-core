import { useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

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
} from 'src/store/earthObservation'

export const LINE_H = 34
export const MAP_MIN_W = 560
export const RIGHT_MIN_W = 460
export const CHAT_MIN_H = 220
export const EDITOR_MIN_H = 220

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

const clampSplitX = (ratio, totalW) => {
  const min = MAP_MIN_W / totalW
  const max = 1 - RIGHT_MIN_W / totalW
  return clamp(ratio, min, max)
}

const clampSplitY = (ratio, totalH) => {
  const min = CHAT_MIN_H / totalH
  const max = 1 - EDITOR_MIN_H / totalH
  return clamp(ratio, min, max)
}

export default function useWorkspaceLayout() {
  const dispatch = useDispatch()
  const { layoutMode, splitX, splitY, chatMin, editorMin, mapMin } = useSelector(s => s.earthObservation.layout)

  const rootRef = useRef(null)
  const rightRef = useRef(null)

  // Clamp stored ratios to respect minimum sizes on mount
  useEffect(() => {
    const w = rootRef.current?.clientWidth || window.innerWidth
    const h = rightRef.current?.clientHeight || window.innerHeight
    dispatch(setSplitX(clampSplitX(splitX, w)))
    dispatch(setSplitY(clampSplitY(splitY, h)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dragX = dx => {
    const w = rootRef.current?.clientWidth || window.innerWidth
    dispatch(setSplitX(clampSplitX(splitX + dx / w, w)))
  }

  const dragY = dy => {
    const h = rightRef.current?.clientHeight || window.innerHeight
    dispatch(setSplitY(clampSplitY(splitY + dy / h, h)))
  }

  const canShowYSplitter = useMemo(() => !chatMin && !editorMin, [chatMin, editorMin])
  const allRightMinimized = chatMin && editorMin
  const useColumnLayout = mapMin || allRightMinimized

  // Panel action handlers
  const actions = {
    map: {
      onMaximize: () => dispatch(maximizeMap()),
      onMinimize: () => dispatch(minimizeMap()),
      onRestore: () => dispatch(restoreMap()),
      onRestoreFromMax: () => dispatch(restoreDefault())
    },
    chat: {
      onMaximize: () => dispatch(maximizeChat()),
      onMinimize: () => dispatch(minimizeChat()),
      onRestore: () => dispatch(restoreChat()),
      onRestoreFromMax: () => dispatch(restoreDefault())
    },
    editor: {
      onMaximize: () => dispatch(maximizeEditor()),
      onMinimize: () => dispatch(minimizeEditor()),
      onRestore: () => dispatch(restoreEditor()),
      onRestoreFromMax: () => dispatch(restoreDefault())
    }
  }

  return {
    // state
    layoutMode,
    splitX,
    splitY,
    chatMin,
    editorMin,
    mapMin,
    // derived
    canShowYSplitter,
    allRightMinimized,
    useColumnLayout,
    // refs
    rootRef,
    rightRef,
    // drag
    dragX,
    dragY,
    // actions
    actions,
    // constants
    LAYOUT,
    LINE_H,
    MAP_MIN_W,
    RIGHT_MIN_W,
    CHAT_MIN_H,
    EDITOR_MIN_H
  }
}
