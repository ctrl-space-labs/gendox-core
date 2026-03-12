import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LayersIcon from '@mui/icons-material/Layers'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

export default function LayersPanel({
  mapLayers,
  visibleLayers,
  layerOpacities,
  layersOpen,
  panelWide,
  setVisibleLayers,
  setLayerOpacities,
  setLayersOpen
}) {
  if (!mapLayers.length) return null

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Header — same height as the other toolbars */}
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
          boxShadow: 2,
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setLayersOpen(p => !p)}
      >
        <LayersIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
        <Typography variant='caption' sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.72rem' }}>
          Layers ({mapLayers.length})
        </Typography>
        {layersOpen ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ExpandLessIcon sx={{ fontSize: 14 }} />}
      </Box>

      {/* Dropdown list — floats below without affecting the row height */}
      {layersOpen && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            ...(panelWide ? { left: 0 } : { right: 0 }),
            mt: 0.5,
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 4,
            width: panelWide ? 200 : 180,
            px: 0.5,
            py: 0.5,
            zIndex: 1100
          }}
        >
          {mapLayers.map((layer, i) => {
            const isVisible = visibleLayers.has(i)
            return (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 0.5,
                  borderRadius: 0.5,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <IconButton
                  size='small'
                  onClick={() =>
                    setVisibleLayers(prev => {
                      const next = new Set(prev)
                      isVisible ? next.delete(i) : next.add(i)
                      return next
                    })
                  }
                  sx={{ p: 0.25, flexShrink: 0 }}
                >
                  {isVisible ? (
                    <VisibilityIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                  ) : (
                    <VisibilityOffIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                  )}
                </IconButton>
                <Tooltip title={layer.name} placement='top' enterDelay={500}>
                  <Typography
                    variant='caption'
                    noWrap
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.68rem',
                      flex: 1,
                      minWidth: 0,
                      color: isVisible ? 'text.primary' : 'text.disabled'
                    }}
                  >
                    {layer.name}
                  </Typography>
                </Tooltip>
                {panelWide && (
                  <input
                    type='range'
                    min={0}
                    max={1}
                    step={0.05}
                    value={layerOpacities[i] ?? 1}
                    disabled={!isVisible}
                    onChange={e =>
                      setLayerOpacities(prev => {
                        const next = [...prev]
                        next[i] = parseFloat(e.target.value)
                        return next
                      })
                    }
                    style={{
                      width: 70,
                      flexShrink: 0,
                      accentColor: '#08B68D',
                      cursor: isVisible ? 'pointer' : 'not-allowed',
                      opacity: isVisible ? 1 : 0.4
                    }}
                  />
                )}
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
