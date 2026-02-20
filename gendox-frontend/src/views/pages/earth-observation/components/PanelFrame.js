import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/views/custom-components/mui/icon/icon'
import { alpha, useTheme } from '@mui/material/styles'
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
        background: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(8px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        boxShadow: (theme.palette.common.white, 0.04),
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            opacity: 0.6,
          }}
        >
          {title}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.25 }}>
          {onMinimize && (
            <Tooltip title='Minimize'>
              <IconButton size='small' onClick={onMinimize} sx={{ opacity: 0.45, '&:hover': { opacity: 1 } }}>
                <Icon icon='mdi:minus' />
              </IconButton>
            </Tooltip>
          )}
          {onMaximize && (
            <Tooltip title='Maximize'>
              <IconButton size='small' onClick={onMaximize} sx={{ opacity: 0.45, '&:hover': { opacity: 1 } }}>
                <Icon icon='mdi:fullscreen' />
              </IconButton>
            </Tooltip>
          )}
          {onRestore && (
            <Tooltip title='Restore layout'>
              <IconButton size='small' onClick={onRestore} sx={{ opacity: 0.45, '&:hover': { opacity: 1 } }}>
                <Icon icon='mdi:fullscreen-exit' />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Content — p:0 and overflow:hidden so map/editor/chat fill the frame correctly */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{children}</Box>
    </Box>
  )
}
