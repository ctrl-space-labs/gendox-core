import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Tooltip from '@mui/material/Tooltip'


export default function PanelLine({ title, onClick, onRestore, onMaximize }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        height: 34,
        px: 1.5,
        borderRadius: 2,
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        userSelect: 'none'
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 13, opacity: 0.9 }}>{title}</Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title='Maximize'>
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation()
              onMaximize?.()
            }}
          >
            <Icon icon='mdi:arrow-expand-all' />
          </IconButton>
        </Tooltip>

        <Tooltip title='Restore default'>
          <IconButton
            size='small'
            onClick={e => {
              e.stopPropagation()
              onRestore?.()
            }}
          >
            <Icon icon='mdi:arrow-collapse-all' />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}
