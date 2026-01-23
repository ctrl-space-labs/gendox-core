import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { useTheme } from '@mui/material/styles'
import Tooltip from '@mui/material/Tooltip'

export default function PanelFrame({ title, children, onMaximize, onMinimize, onRestore }) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        background: (theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(8px)',
        boxShadow: (theme.palette.common.white, 0.04),
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: (theme.palette.common.white, 0.05)
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{title}</Typography>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {onMinimize && (
            <Tooltip title='Minimize'>
              <IconButton size='small' onClick={onMinimize}>
                <Icon icon='mdi:minus' />
              </IconButton>
            </Tooltip>
          )}
          {onMaximize && (
            <Tooltip title='Maximize'>
              <IconButton size='small' onClick={onMaximize}>
                <Icon icon='mdi:arrow-expand-all' />
              </IconButton>
            </Tooltip>
          )}
          {onRestore && (
            <Tooltip title='Restore'>
              <IconButton size='small' onClick={onRestore}>
                <Icon icon='mdi:arrow-collapse-all' />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, p: 2, overflow: 'auto' }}>{children}</Box>
    </Box>
  )
}
