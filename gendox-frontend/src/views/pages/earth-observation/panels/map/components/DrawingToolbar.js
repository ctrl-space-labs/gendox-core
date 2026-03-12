import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import HexagonIcon from '@mui/icons-material/Hexagon'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import TimelineIcon from '@mui/icons-material/Timeline'

const toolBtnSx = (activeTool, tool) => ({
  width: 30,
  height: 30,
  p: 0,
  minWidth: 0,
  border: 1,
  borderColor: activeTool === tool ? 'primary.main' : 'divider',
  bgcolor: activeTool === tool ? 'primary.main' : 'background.paper',
  color: activeTool === tool ? '#fff' : 'text.primary',
  borderRadius: 1,
  '&:hover': { bgcolor: activeTool === tool ? 'primary.dark' : 'action.hover' }
})

export default function DrawingToolbar({ activeTool, pendingVertices, canFinish, onSelectTool, onFinish, onCancel }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        px: 1,
        py: 0.5,
        boxShadow: 2
      }}
    >
      <Tooltip title='Point'>
        <IconButton size='small' sx={toolBtnSx(activeTool, 'point')} onClick={() => onSelectTool('point')}>
          <RadioButtonUncheckedIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>

      <Tooltip title='LinearRing'>
        <IconButton size='small' sx={toolBtnSx(activeTool, 'linearRing')} onClick={() => onSelectTool('linearRing')}>
          <TimelineIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>

      <Tooltip title='Polygon'>
        <IconButton size='small' sx={toolBtnSx(activeTool, 'polygon')} onClick={() => onSelectTool('polygon')}>
          <HexagonIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>

      {activeTool && activeTool !== 'point' && (
        <>
          <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />
          <Tooltip title={canFinish ? 'Finish' : `Need ${activeTool === 'linearRing' ? 2 : 3}+ points`}>
            <span>
              <IconButton
                size='small'
                disabled={!canFinish}
                onClick={onFinish}
                sx={{ width: 30, height: 30, p: 0, border: 1, borderColor: 'divider', color: 'success.main' }}
              >
                <CheckIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title='Cancel'>
            <IconButton
              size='small'
              onClick={onCancel}
              sx={{ width: 30, height: 30, p: 0, border: 1, borderColor: 'divider', color: 'error.main' }}
            >
              <CloseIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Typography variant='caption' sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.65rem' }}>
            {pendingVertices.length} pt{pendingVertices.length !== 1 ? 's' : ''}
          </Typography>
        </>
      )}
    </Box>
  )
}
