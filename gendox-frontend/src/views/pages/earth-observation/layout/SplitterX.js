import { useState, useRef } from 'react'
import Box from '@mui/material/Box'

// Vertical divider between the Map panel and the right column.
//
// Key design decisions:
//   • Pointer capture — routes move/up events to this element even when the
//     pointer leaves it, so fast drags never "lose" the splitter.
//   • Incremental delta — each move sends (current - last), not (current - start).
//     Combined with the ref-based splitX in useWorkspaceLayout this eliminates
//     the stale-closure jump that occurred with the old "total from start" approach.
//   • RAF accumulation — multiple pointer-move events within a single frame are
//     merged into one onDrag call to avoid redundant Redux dispatches.
//   • draggingRef mirrors dragging state so the move handler always reads the
//     current value without depending on a re-render cycle.
export default function SplitterX({ onDrag }) {
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)

  const draggingRef = useRef(false) // synchronous mirror of dragging state
  const lastXRef    = useRef(0)
  const pendingRef  = useRef(0)     // accumulated delta waiting for RAF flush
  const rafRef      = useRef(null)

  const flush = () => {
    if (pendingRef.current !== 0) {
      onDrag(pendingRef.current)
      pendingRef.current = 0
    }
    rafRef.current = null
  }

  const handlePointerDown = e => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    lastXRef.current    = e.clientX
    draggingRef.current = true
    setDragging(true)
  }

  const handlePointerMove = e => {
    if (!draggingRef.current) return
    pendingRef.current += e.clientX - lastXRef.current
    lastXRef.current    = e.clientX
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flush)
  }

  const handlePointerUp = e => {
    // Flush any remaining delta so the final position is never dropped
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); flush() }
    e.currentTarget.releasePointerCapture(e.pointerId)
    draggingRef.current = false
    setDragging(false)
  }

  const active = hovered || dragging

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      sx={{
        width: 14,
        flexShrink: 0,
        cursor: 'col-resize',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Track line */}
      <Box
        sx={{
          position: 'absolute',
          width: active ? 3 : 2,
          height: '100%',
          borderRadius: 999,
          bgcolor: active ? 'primary.main' : 'divider',
          opacity: active ? 0.65 : 0.3,
          transition: 'width 0.15s, opacity 0.15s, background-color 0.15s'
        }}
      />

      {/* Grip dots — visible on hover/drag */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          opacity: active ? 1 : 0,
          transition: 'opacity 0.15s',
          zIndex: 1
        }}
      >
        {[0, 1, 2, 3, 4].map(i => (
          <Box key={i} sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'primary.main' }} />
        ))}
      </Box>
    </Box>
  )
}
