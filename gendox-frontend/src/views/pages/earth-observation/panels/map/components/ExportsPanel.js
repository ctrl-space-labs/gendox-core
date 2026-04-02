import { useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import StopIcon from '@mui/icons-material/Stop'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'

import { useDispatch } from 'react-redux'

import { cancelGeeExport } from 'src/store/earthObservation'

function getFirstDestinationHref(uris) {
  if (!Array.isArray(uris)) return null
  const u = uris.find(x => typeof x === 'string' && /^https?:\/\//i.test(x))
  return u || null
}

function getExportRowStatus(exp) {
  const u = String(exp.state || '').toUpperCase()
  if (u === 'CANCELLED' || u === 'CANCELED') return 'cancelled'
  if (exp.error || u === 'FAILED') return 'failed'
  if (u === 'SUCCEEDED' || u === 'COMPLETED' || exp.done === true) return 'completed'
  return 'running'
}

function formatProgressPercent(progress) {
  if (progress == null || Number.isNaN(Number(progress))) return null
  const n = Number(progress)
  const pct = n <= 1 ? Math.round(n * 100) : Math.round(n)
  return Math.min(100, Math.max(0, pct))
}

function exportDisplayName(exp) {
  return exp.description?.trim() || 'Export'
}

function isCancellingState(exp) {
  const u = String(exp.state || '').toUpperCase()
  return u === 'CANCELLING' || u === 'CANCELING'
}

export default function ExportsPanel({ geeExports }) {
  const dispatch = useDispatch()
  const [listOpen, setListOpen] = useState(true)
  const hasExports = geeExports.length > 0

  if (!hasExports) return null

  return (
    <Box
      sx={{
        width: 240,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: 8,
        zIndex: 1100
      }}
    >
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
        <CloudUploadIcon sx={{ fontSize: 13, color: 'text.secondary', mr: 0.75 }} />
        <Typography
          sx={{
            flex: 1,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'text.secondary'
          }}
        >
          Exports ({geeExports.length})
        </Typography>
        <IconButton
          size='small'
          onClick={() => setListOpen(p => !p)}
          sx={{ p: 0.25, color: 'text.secondary', '&:hover': { bgcolor: 'action.selected' } }}
        >
          {listOpen ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
        </IconButton>
      </Box>

      {listOpen && (
        <Box sx={{ py: 0.5 }}>
          {geeExports.map(exp => {
            const status = getExportRowStatus(exp)
            const cancelling = isCancellingState(exp)
            const name = exportDisplayName(exp)
            const pct = formatProgressPercent(exp.progress)
            const href = status === 'completed' ? getFirstDestinationHref(exp.destinationUris) : null
            const rowHoverTitle =
              status === 'failed'
                ? exp.error || 'Export failed'
                : status === 'cancelled'
                  ? exp.error || 'Cancelled'
                  : ''

            return (
              <Tooltip
                key={exp.id}
                title={rowHoverTitle}
                disableHoverListener={!rowHoverTitle}
                enterDelay={400}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.35,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                {status === 'running' && (
                  <CircularProgress size={13} thickness={5} sx={{ flexShrink: 0, color: 'primary.main' }} />
                )}
                {status === 'completed' && href && (
                  <Tooltip title='Open destination'>
                    <IconButton
                      component='a'
                      href={href}
                      target='_blank'
                      rel='noopener noreferrer'
                      size='small'
                      sx={{ p: 0.25, flexShrink: 0, color: 'primary.main' }}
                    >
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
                {status === 'completed' && !href && <Box sx={{ width: 28, flexShrink: 0 }} aria-hidden />}
                {status === 'cancelled' && (
                  <Box sx={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center', width: 28 }}>
                    <CancelOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </Box>
                )}
                {status === 'failed' && (
                  <Box sx={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center', width: 28 }}>
                    <ErrorOutlineIcon sx={{ fontSize: 16, color: 'error.main' }} />
                  </Box>
                )}

                <Tooltip title={name} enterDelay={500}>
                  <Typography
                    noWrap
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 11,
                      color: status === 'failed' || status === 'cancelled' ? 'text.secondary' : 'text.primary'
                    }}
                  >
                    {name}
                  </Typography>
                </Tooltip>

                {status === 'running' && pct != null && (
                  <Typography sx={{ flexShrink: 0, fontSize: 10, color: 'text.secondary', width: 34, textAlign: 'right' }}>
                    {pct}%
                  </Typography>
                )}
                {status === 'running' && pct == null && <Box sx={{ width: 34, flexShrink: 0 }} />}

                {status === 'running' && (
                  <Tooltip title={cancelling ? 'Canceling...' : 'Cancel export'}>
                    <Box component='span' sx={{ display: 'inline-flex', flexShrink: 0 }}>
                      <IconButton
                        size='small'
                        disabled={cancelling}
                        onClick={() => dispatch(cancelGeeExport(exp.taskId || exp.id))}
                        sx={{ p: 0.25, color: 'text.secondary' }}
                      >
                        <StopIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Tooltip>
                )}
                {status === 'completed' && (
                  <>
                    <Box sx={{ width: 34, flexShrink: 0 }} />
                    <Box sx={{ width: 28, flexShrink: 0 }} />
                  </>
                )}
                {status === 'cancelled' && (
                  <>
                    <Box sx={{ width: 34, flexShrink: 0 }} />
                    <Box sx={{ width: 28, flexShrink: 0 }} />
                  </>
                )}
                {status === 'failed' && (
                  <>
                    <Box sx={{ width: 34, flexShrink: 0 }} />
                    <Box sx={{ width: 28, flexShrink: 0 }} />
                  </>
                )}
                </Box>
              </Tooltip>
            )
          })}
        </Box>
      )}
    </Box>
  )
}
