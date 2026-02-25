import { useState } from 'react'
import Box from '@mui/material/Box'

export default function SplitterX({ onDrag }) {
  const [hovered, setHovered] = useState(false)
  const [dragging, setDragging] = useState(false)

  const active = hovered || dragging

  const onPointerDown = e => {
    e.preventDefault()
    setDragging(true)
    const startX = e.clientX
    let pendingDx = 0
    let rafScheduled = false

    const move = ev => {
      pendingDx = ev.clientX - startX
      if (rafScheduled) return
      rafScheduled = true
      requestAnimationFrame(() => {
        onDrag(pendingDx)
        rafScheduled = false
      })
    }

    const up = () => {
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <Box
      onPointerDown={onPointerDown}
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
        userSelect: 'none',
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
          transition: 'width 0.15s, opacity 0.15s, background-color 0.15s',
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
          zIndex: 1,
        }}
      >
        {[0, 1, 2, 3, 4].map(i => (
          <Box
            key={i}
            sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'primary.main' }}
          />
        ))}
      </Box>
    </Box>
  )
}
