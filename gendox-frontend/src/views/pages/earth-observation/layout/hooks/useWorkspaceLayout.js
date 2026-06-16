import { useCallback, useEffect, useMemo, useRef } from 'react'
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
  restoreEditor,
  restoreChatFromMax,
  restoreEditorFromMax
} from 'src/store/earthObservation'

export const LINE_H      = 34
export const MAP_MIN_W   = 360
export const RIGHT_MIN_W = 320
export const CHAT_MIN_H  = 180
export const EDITOR_MIN_H = 180

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

const clampSplitX = (ratio, totalW) => clamp(ratio, MAP_MIN_W / totalW, 1 - RIGHT_MIN_W / totalW)
const clampSplitY = (ratio, totalH) => clamp(ratio, CHAT_MIN_H / totalH, 1 - EDITOR_MIN_H / totalH)

export default function useWorkspaceLayout() {
  const dispatch = useDispatch()
  const { layoutMode, splitX, splitY, chatMin, editorMin, mapMin } =
    useSelector(s => s.earthObservation.layout)

  const rootRef  = useRef(null)
  const rightRef = useRef(null)

  // ── Stale-closure fix ───────────────────────────────────────────────────────
  // splitX/splitY come from Redux state and are captured at render time. If two
  // consecutive RAF callbacks fire before React has re-rendered (which happens
  // when the user drags quickly), the second call would use the OLD splitX and
  // produce a jump. Solution: keep refs that are updated every render AND
  // optimistically ahead-of-time inside the drag handlers.
  const splitXRef = useRef(splitX)
  const splitYRef = useRef(splitY)
  splitXRef.current = splitX // keep in sync with Redux on every render
  splitYRef.current = splitY

  // Re-clamp split ratios whenever the workspace is resized.
  // A mount-only clamp is not enough: if the user resizes the window after
  // mount the stored splitX can violate MAP_MIN_W or RIGHT_MIN_W, causing
  // the right column to overflow at intermediate screen widths (e.g. 1078 px).
  useEffect(() => {
    const clampAll = () => {
      const w = rootRef.current?.clientWidth   || window.innerWidth
      const h = rightRef.current?.clientHeight || window.innerHeight
      // Use the refs so the effect never captures a stale ratio value
      dispatch(setSplitX(clampSplitX(splitXRef.current, w)))
      dispatch(setSplitY(clampSplitY(splitYRef.current, h)))
    }

    clampAll() // initial clamp on mount

    const ro = new ResizeObserver(clampAll)
    if (rootRef.current) ro.observe(rootRef.current)

    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // dragX / dragY receive incremental deltas from the splitter components.
  // They read from refs (not stale closure values) and write back optimistically
  // so rapid moves before the next re-render still produce correct positions.
  const dragX = useCallback(dx => {
    const w    = rootRef.current?.clientWidth || window.innerWidth
    const next = clampSplitX(splitXRef.current + dx / w, w)
    splitXRef.current = next // optimistic write — prevents stale reads on rapid moves
    dispatch(setSplitX(next))
  }, [dispatch])

  const dragY = useCallback(dy => {
    const h    = rightRef.current?.clientHeight || window.innerHeight
    const next = clampSplitY(splitYRef.current + dy / h, h)
    splitYRef.current = next
    dispatch(setSplitY(next))
  }, [dispatch])

  const canShowYSplitter  = useMemo(() => !chatMin && !editorMin, [chatMin, editorMin])
  const allRightMinimized = chatMin && editorMin
  const useColumnLayout   = mapMin || allRightMinimized

  // Panel action handlers — grouped by panel for clean destructuring at call sites.
  // restoreChatFromMax / restoreEditorFromMax are single-action replacements for
  // the previous double-dispatch pattern (restoreChat + restoreDefault).
  const actions = {
    map: {
      onMaximize:      () => dispatch(maximizeMap()),
      onMinimize:      () => dispatch(minimizeMap()),
      onRestore:       () => dispatch(restoreMap()),
      onRestoreFromMax:() => dispatch(restoreDefault())
    },
    chat: {
      onMaximize:      () => dispatch(maximizeChat()),
      onMinimize:      () => dispatch(minimizeChat()),
      onRestore:       () => dispatch(restoreChat()),
      onRestoreFromMax:() => dispatch(restoreDefault()),
      onRestoreFromMaxAndUnmin: () => dispatch(restoreChatFromMax())
    },
    editor: {
      onMaximize:      () => dispatch(maximizeEditor()),
      onMinimize:      () => dispatch(minimizeEditor()),
      onRestore:       () => dispatch(restoreEditor()),
      onRestoreFromMax:() => dispatch(restoreDefault()),
      onRestoreFromMaxAndUnmin: () => dispatch(restoreEditorFromMax())
    }
  }

  return {
    layoutMode, splitX, splitY, chatMin, editorMin, mapMin,
    canShowYSplitter, allRightMinimized, useColumnLayout,
    rootRef, rightRef,
    dragX, dragY,
    actions,
    LAYOUT, LINE_H, MAP_MIN_W, RIGHT_MIN_W, CHAT_MIN_H, EDITOR_MIN_H
  }
}
