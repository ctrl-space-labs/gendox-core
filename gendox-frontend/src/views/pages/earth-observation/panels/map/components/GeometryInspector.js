import { useState, useRef } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { geomLabel } from '../utils/geometryHelpers'
import { GEOM_ICON } from '../constants/geometryConstants'

export default function GeometryInspector({
  geometries,
  inspectorOpen,
  setInspectorOpen,
  inspectorRowRefs,
  onToggleVisibility,
  onUpdateTitle,
  onCopyGeometry,
  onDeleteGeometry,
  onDeleteAll
}) {
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef(null)

  const startEdit = (e, geom) => {
    e.stopPropagation()
    setEditingId(geom.id)
    setEditValue(geomLabel(geom, geometries.indexOf(geom)))
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onUpdateTitle(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

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
          Geometries ({geometries.length})
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
        <Box sx={{ px: 0.5, py: 0.75, maxHeight: 200, overflowY: 'auto' }}>
          {geometries.map((geom, i) => {
            const isVisible = geom.isVisible ?? true
            const isEditing = editingId === geom.id
            return (
              <Box
                key={geom.id ?? i}
                ref={el => {
                  inspectorRowRefs.current[i] = el
                }}
                onClick={() => !isEditing && onToggleVisibility(geom.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 0.5,
                  minWidth: 0,
                  borderRadius: 0.5,
                  cursor: isEditing ? 'default' : 'pointer',
                  borderLeft: isVisible ? '2px solid' : '2px solid transparent',
                  borderColor: isVisible ? 'text.primary' : 'transparent'
                }}
              >
                {/* Type icon */}
                <Box sx={{ display: 'flex', color: isVisible ? 'text.primary' : 'text.disabled', flexShrink: 0 }}>
                  {(() => {
                    const Icon = GEOM_ICON[geom.type] ?? GEOM_ICON.Point
                    return <Icon sx={{ fontSize: 13 }} />
                  })()}
                </Box>

                {isEditing ? (
                  <Box
                    component='input'
                    ref={inputRef}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        commitEdit()
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        cancelEdit()
                      }
                    }}
                    onClick={e => e.stopPropagation()}
                    sx={{
                      flex: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.68rem',
                      border: 'none',
                      borderBottom: '1px solid',
                      borderColor: 'text.primary',
                      outline: 'none',
                      background: 'transparent',
                      color: 'text.primary',
                      px: 0,
                      py: 0
                    }}
                  />
                ) : (
                  <Tooltip title={geomLabel(geom, i)} enterDelay={600}>
                    <Typography
                      variant='caption'
                      onDoubleClick={e => startEdit(e, geom)}
                      noWrap
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        fontFamily: 'monospace',
                        fontSize: '0.68rem',
                        color: isVisible ? 'text.primary' : 'text.disabled',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {geomLabel(geom, i)}
                    </Typography>
                  </Tooltip>
                )}

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
