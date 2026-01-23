import Box from '@mui/material/Box'

export default function SplitterX({ onDrag }) {
  const onPointerDown = e => {
    e.preventDefault()
    const startX = e.clientX

    const move = ev => onDrag(ev.clientX - startX)
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <Box
      onPointerDown={onPointerDown}
      sx={{
        width: 10,
        cursor: 'col-resize',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch'
      }}
    >
      <Box sx={{ width: 2, borderRadius: 999, bgcolor: 'divider', opacity: 0.35 }} />
    </Box>
  )
}