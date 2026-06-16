import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'

import { GEOM_ICON } from '../constants/geometryConstants'

// Rendered inside the unified left toolbar — no own container wrapper.
export default function DrawingToolbar({ activeTool, pendingVertices, canFinish, onSelectTool, onFinish, onCancel }) {
  const btnSx = tool => ({
    width: 40,
    height: 40,
    borderRadius: 1.5,
    color: activeTool === tool ? 'primary.contrastText' : 'text.secondary',
    bgcolor: activeTool === tool ? 'primary.main' : 'transparent',
    '&:hover': {
      bgcolor: activeTool === tool ? 'primary.dark' : 'action.selected',
      color: activeTool === tool ? 'primary.contrastText' : 'primary.main'
    }
  })

  return (
    <>
      <Tooltip title='Point' placement='right'>
        <IconButton sx={btnSx('point')} onClick={() => onSelectTool('point')}>
          <GEOM_ICON.Point sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Tooltip title='Linear Ring' placement='right'>
        <IconButton sx={btnSx('linearRing')} onClick={() => onSelectTool('linearRing')}>
          <GEOM_ICON.LinearRing sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Tooltip title='Polygon' placement='right'>
        <IconButton sx={btnSx('polygon')} onClick={() => onSelectTool('polygon')}>
          <GEOM_ICON.Polygon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      {/* Contextual finish / cancel — visible only while drawing a multi-point shape */}
      {activeTool && activeTool !== 'point' && (
        <>
          <Divider flexItem sx={{ my: 0.5 }} />

          <Typography
            sx={{ fontSize: '0.65rem', color: 'text.secondary', textAlign: 'center', lineHeight: 1.3, userSelect: 'none' }}
          >
            {pendingVertices.length} pt{pendingVertices.length !== 1 ? 's' : ''}
          </Typography>

          <Tooltip
            title={canFinish ? 'Finish drawing' : `Need ${activeTool === 'linearRing' ? '2' : '3'}+ points`}
            placement='right'
          >
            <Box component='span'>
              <IconButton
                disabled={!canFinish}
                onClick={onFinish}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  color: 'success.main',
                  '&:hover': { bgcolor: 'action.selected' },
                  '&.Mui-disabled': { color: 'action.disabled' }
                }}
              >
                <CheckIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Tooltip>

          <Tooltip title='Cancel drawing' placement='right'>
            <IconButton
              onClick={onCancel}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                color: 'error.main',
                '&:hover': { bgcolor: 'action.selected' }
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </>
      )}
    </>
  )
}
