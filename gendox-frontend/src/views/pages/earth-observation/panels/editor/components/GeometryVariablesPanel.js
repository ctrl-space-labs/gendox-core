import { useState } from 'react'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import toast from 'react-hot-toast'

import { selectEoGeometries } from 'src/store/earthObservation'
import { GEOM_ICON, GEOM_TYPE_MAP } from 'src/views/pages/earth-observation/panels/map/constants/geometryConstants'
import { geometrySlug } from 'src/views/pages/earth-observation/panels/map/utils/geometryHelpers'

function normalizeType(geometryTypeName) {
  return GEOM_TYPE_MAP[geometryTypeName] ?? geometryTypeName
}

export default function GeometryVariablesPanel() {
  const eoGeometries = useSelector(selectEoGeometries)
  const [open, setOpen] = useState(true)

  if (!eoGeometries || eoGeometries.length === 0) return null

  const handleCopy = snippet => {
    navigator.clipboard?.writeText(snippet).then(() => toast.success('Copied!'))
  }

  return (
    <Box
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        flexShrink: 0,
        bgcolor: 'background.default'
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setOpen(p => !p)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1.5,
          py: 0.4,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { bgcolor: 'action.hover' }
        }}
      >
        <Typography
          variant='caption'
          sx={{ flex: 1, fontFamily: 'monospace', fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary' }}
        >
          Geometry imports ({eoGeometries.length})
        </Typography>
        {open ? (
          <ExpandLessIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        )}
      </Box>

      {/* Hint + scrollable row list (row area ~half previous height so ~2–3 geometries show) */}
      {open && (
        <Box sx={{ px: 1, pb: 0.5 }}>
          <Typography
            variant='caption'
            component='div'
            sx={{
              px: 0.5,
              pb: 0.5,
              fontSize: '0.62rem',
              color: 'text.disabled',
              lineHeight: 1.35
            }}
          >
            In Run Code scripts:{' '}
            <Box component='span' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
              geometries[i]
            </Box>
            ,{' '}
            <Box component='span' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
              geometries[&quot;Title&quot;]
            </Box>
            , or{' '}
            <Box component='span' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
              geometries.slug
            </Box>{' '}
            (slug = lowercased title, letters/digits only).
          </Typography>
          <Box sx={{ maxHeight: 60, overflowY: 'auto' }}>
          {eoGeometries.map((geom, i) => {
            const type = normalizeType(geom.geometryTypeName)
            const Icon = GEOM_ICON[type] ?? GEOM_ICON.Point
            const label = geom.title || geom.name || `${type} ${i + 1}`
            const snippet = `geometries["${label}"]`
            const slug = geometrySlug(label)
            const slugHint = slug ? `geometries.${slug}` : null

            return (
              <Box
                key={geom.id ?? i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  py: 0.2,
                  px: 0.5,
                  borderRadius: 0.5,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                {/* Type icon */}
                <Icon sx={{ fontSize: 12, color: 'text.secondary', flexShrink: 0 }} />

                {/* Access snippet */}
                <Typography
                  variant='caption'
                  sx={{
                    flex: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.68rem',
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {snippet}
                </Typography>

                {/* Index badge */}
                <Typography
                  variant='caption'
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.62rem',
                    color: 'text.disabled',
                    flexShrink: 0
                  }}
                >
                  [{i}]
                </Typography>

                {/* Copy button */}
                <Tooltip
                  title={
                    slugHint
                      ? `Copy: ${snippet} · geometries[${i}] · ${slugHint}`
                      : `Copy: ${snippet} · geometries[${i}]`
                  }
                  placement='top'
                  enterDelay={400}
                >
                  <IconButton size='small' onClick={() => handleCopy(snippet)} sx={{ p: 0.25, flexShrink: 0 }}>
                    <ContentCopyIcon sx={{ fontSize: 10 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          })}
          </Box>
        </Box>
      )}
    </Box>
  )
}
