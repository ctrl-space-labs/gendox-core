import { useState, useRef } from 'react'
import Box from '@mui/material/Box'

// Horizontal divider between the Editor and Chat panels (right column, DEFAULT mode).
// Same design decisions as SplitterX — see that file for the full rationale.
export default function SplitterY({ onDrag }) {
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)

  const draggingRef = useRef(false)
  const lastYRef    = useRef(0)
  const pendingRef  = useRef(0)
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
    lastYRef.current    = e.clientY
    draggingRef.current = true
    setDragging(true)
  }

  const handlePointerMove = e => {
    if (!draggingRef.current) return
    pendingRef.current += e.clientY - lastYRef.current
    lastYRef.current    = e.clientY
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flush)
  }

  const handlePointerUp = e => {
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
        height: 14,
        flexShrink: 0,
        cursor: 'row-resize',
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
          height: active ? 3 : 2,
          width: '100%',
          borderRadius: 999,
          bgcolor: active ? 'primary.main' : 'divider',
          opacity: active ? 0.65 : 0.3,
          transition: 'height 0.15s, opacity 0.15s, background-color 0.15s'
        }}
      />

      {/* Grip dots — visible on hover/drag */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
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
