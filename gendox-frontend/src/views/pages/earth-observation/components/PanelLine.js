import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/views/custom-components/mui/icon/icon'
import Tooltip from '@mui/material/Tooltip'
import { alpha, useTheme } from '@mui/material/styles'

export default function PanelLine({ title, onClick, onRestore, onMaximize }) {
  const theme = useTheme()

  return (
    <Box
      onClick={onClick}
      sx={{
        height: 34,
        px: 1.5,
        borderRadius: 2,
        bgcolor: 'action.hover',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background 0.15s',
        '&:hover': {
          background: alpha(theme.palette.background.paper, 0.6),
        },
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          opacity: 0.65,
        }}
      >
        {title}
      </Typography>

      <Box sx={{ display: 'flex', gap: 0.25 }}>
        {onRestore && (
          <Tooltip title='Restore'>
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation()
                onRestore?.()
              }}
              sx={{ opacity: 0.45, '&:hover': { opacity: 1 } }}
            >
              <Icon icon='mdi:fullscreen-exit' />
            </IconButton>
          </Tooltip>
        )}
        {onMaximize && (
          <Tooltip title='Maximize'>
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation()
                onMaximize?.()
              }}
              sx={{ opacity: 0.45, '&:hover': { opacity: 1 } }}
            >
              <Icon icon='mdi:fullscreen' />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}
