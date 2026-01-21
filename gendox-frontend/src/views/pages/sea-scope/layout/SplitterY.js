import Box from '@mui/material/Box'

export default function SplitterY({ onDrag }) {
  const onPointerDown = e => {
    e.preventDefault()
    const startY = e.clientY

    const move = ev => onDrag(ev.clientY - startY)
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
        height: 10,
        cursor: 'row-resize',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Box sx={{ height: 2, width: '100%', borderRadius: 999, bgcolor: 'divider', opacity: 0.35 }} />
    </Box>
  )
}