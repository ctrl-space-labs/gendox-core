import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

import { geomSummary } from '../utils/geometryHelpers'

export default function GeometryInspector({
  geometries,
  selectedGeometryIndex,
  setSelectedGeometryIndex,
  inspectorOpen,
  setInspectorOpen,
  inspectorRowRefs,
  onCopyGeometry,
  onDeleteGeometry,
  onDeleteAll
}) {
  if (!geometries.length) return null

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        right: 12,
        zIndex: 1000,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        boxShadow: 4,
        minWidth: 230,
        maxWidth: 300
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          borderBottom: inspectorOpen ? 1 : 0,
          borderColor: 'divider'
        }}
      >
        <Typography variant='caption' sx={{ flex: 1, fontWeight: 700, fontFamily: 'monospace' }}>
          Geometry Imports ({geometries.length})
        </Typography>
        <Tooltip title='Clear all'>
          <IconButton size='small' onClick={onDeleteAll}>
            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        <IconButton size='small' onClick={() => setInspectorOpen(p => !p)}>
          {inspectorOpen ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ExpandLessIcon sx={{ fontSize: 14 }} />}
        </IconButton>
      </Box>

      {/* Body */}
      {inspectorOpen && (
        <Box sx={{ px: 1, py: 0.75, maxHeight: 180, overflowY: 'auto' }}>
          <Typography variant='caption' sx={{ display: 'block', fontFamily: 'monospace', color: 'text.secondary' }}>
            type: GeometryCollection
          </Typography>
          <Typography
            variant='caption'
            sx={{ display: 'block', fontFamily: 'monospace', color: 'text.secondary', mb: 0.5 }}
          >
            geometries: List ({geometries.length} elements)
          </Typography>
          {geometries.map((geom, i) => {
            const isSelected = selectedGeometryIndex === i
            return (
              <Box
                key={i}
                ref={el => {
                  inspectorRowRefs.current[i] = el
                }}
                onClick={() => setSelectedGeometryIndex(isSelected ? null : i)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 0.5,
                  cursor: 'pointer',
                  bgcolor: isSelected ? 'action.selected' : 'transparent',
                  borderLeft: isSelected ? '2px solid' : '2px solid transparent',
                  borderColor: isSelected ? 'primary.light' : 'transparent',
                  '&:hover': { bgcolor: isSelected ? 'action.selected' : 'action.hover' }
                }}
              >
                <Typography
                  variant='caption'
                  sx={{
                    flex: 1,
                    fontFamily: 'monospace',
                    pl: 1,
                    fontSize: '0.68rem',
                    color: isSelected ? 'primary.light' : 'text.primary'
                  }}
                >
                  {geomSummary(geom, i)}
                </Typography>
                <Tooltip title='Copy as ee.Geometry'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      onCopyGeometry(geom)
                    }}
                    sx={{ p: 0.25 }}
                  >
                    <ContentCopyIcon sx={{ fontSize: 10 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Remove'>
                  <IconButton
                    size='small'
                    onClick={e => {
                      e.stopPropagation()
                      onDeleteGeometry(geom.id, i)
                    }}
                    sx={{ p: 0.25 }}
                  >
                    <CloseIcon sx={{ fontSize: 10 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
