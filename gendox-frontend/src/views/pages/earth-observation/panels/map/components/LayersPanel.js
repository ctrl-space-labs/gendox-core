import { useState } from 'react'
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
  setVisibleLayers,
  setLayerOpacities,
  setLayersOpen
}) {
  const [listOpen, setListOpen] = useState(true)
  const hasLayers = mapLayers.length > 0

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Standalone trigger button */}
      <Tooltip title={hasLayers ? `Layers (${mapLayers.length})` : 'No layers yet — run a script first'} placement='bottom'>
        <Box component='span'>
          <IconButton
            disabled={!hasLayers}
            onClick={() => setLayersOpen(p => !p)}
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              color: layersOpen && hasLayers ? 'primary.main' : 'text.secondary',
              bgcolor: layersOpen && hasLayers ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.selected', color: 'primary.main' },
              '&.Mui-disabled': { color: 'action.disabled' }
            }}
          >
            <LayersIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Tooltip>

      {/* Dropdown panel */}
      {layersOpen && hasLayers && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            boxShadow: 8,
            width: 240,
            zIndex: 1100
          }}
        >
          {/* Header with collapse toggle */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.25,
              height: 40,
              flexShrink: 0,
              borderBottom: listOpen ? '1px solid' : 'none',
              borderColor: 'divider'
            }}
          >
            <LayersIcon sx={{ fontSize: 13, color: 'text.secondary', mr: 0.75 }} />
            <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
              Layers ({mapLayers.length})
            </Typography>
            <IconButton
              size='small'
              onClick={() => setListOpen(p => !p)}
              sx={{ p: 0.25, color: 'text.secondary', '&:hover': { bgcolor: 'action.selected' } }}
            >
              {listOpen ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          </Box>

          {/* Layer rows — one compact row per layer */}
          {listOpen && (
            <Box sx={{ py: 0.5 }}>
              {mapLayers.map((layer, i) => {
                const isVisible = visibleLayers.has(i)
                return (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      px: 1,
                      py: 0.35,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    {/* Visibility toggle */}
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
                      {isVisible
                        ? <VisibilityIcon sx={{ fontSize: 13, color: 'primary.main' }} />
                        : <VisibilityOffIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                      }
                    </IconButton>

                    {/* Layer name */}
                    <Tooltip title={layer.name} enterDelay={600}>
                      <Typography
                        noWrap
                        sx={{ flex: 1, minWidth: 0, fontSize: 11, color: isVisible ? 'text.primary' : 'text.disabled' }}
                      >
                        {layer.name}
                      </Typography>
                    </Tooltip>

                    {/* Opacity slider — inline */}
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
                        width: 64,
                        flexShrink: 0,
                        accentColor: '#9155FD',
                        cursor: isVisible ? 'pointer' : 'not-allowed',
                        opacity: isVisible ? 1 : 0.3
                      }}
                    />
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
