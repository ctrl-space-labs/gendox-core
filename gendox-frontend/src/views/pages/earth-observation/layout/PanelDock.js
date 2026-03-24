import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useDispatch, useSelector } from 'react-redux'
import { restoreMap, restoreChat, restoreEditor } from 'src/store/earthObservation'

export default function PanelDock() {
  const dispatch = useDispatch()
  const { chatMin, editorMin, mapMin } = useSelector(state => state.earthObservation.layout)

  const items = [
    { id: 'map', label: 'Map', minimized: mapMin, onRestore: () => dispatch(restoreMap()) },
    { id: 'chat', label: 'Chat', minimized: chatMin, onRestore: () => dispatch(restoreChat()) },
    { id: 'editor', label: 'Editor', minimized: editorMin, onRestore: () => dispatch(restoreEditor()) }
  ].filter(x => x.minimized)

  if (items.length === 0) return null

  return (
    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
      {items.map(item => (
        <Button key={item.id} size='small' variant='outlined' onClick={item.onRestore}>
          Restore {item.label}
        </Button>
      ))}
    </Box>
  )
}
