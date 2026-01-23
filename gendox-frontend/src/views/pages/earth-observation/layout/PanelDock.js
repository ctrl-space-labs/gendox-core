import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useDispatch, useSelector } from 'react-redux'
import { PANELS, restorePanel } from 'src/store/earthObservation/earthObservation'

export default function PanelDock() {
  const dispatch = useDispatch()
  const minimized = useSelector(state => state.earthObservation.minimized)

  const items = [
    { id: PANELS.MAP, label: 'Map' },
    { id: PANELS.CHAT, label: 'Chat' },
    { id: PANELS.EDITOR, label: 'Editor' }
  ].filter(x => minimized[x.id])

  if (items.length === 0) return null

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1,
        justifyContent: 'flex-end'
      }}
    >
      {items.map(item => (
        <Button key={item.id} size='small' variant='outlined' onClick={() => dispatch(restorePanel(item.id))}>
          Restore {item.label}
        </Button>
      ))}
    </Box>
  )
}
