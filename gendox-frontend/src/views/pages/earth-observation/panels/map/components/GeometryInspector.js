import { useState, useRef, useEffect } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CategoryIcon from '@mui/icons-material/Category'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditIcon from '@mui/icons-material/Edit'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

import { geomLabel } from '../utils/geometryHelpers'
import { GEOM_ICON } from '../constants/geometryConstants'

// Rendered inside the unified left toolbar — the button toggles a panel that opens to the right.
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
  const [listOpen, setListOpen] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef(null)

  // savingId: which geometry is waiting for the API to confirm the new title
  // pendingTitles: { [id]: newTitle } — optimistic label shown while in-flight
  const [savingId, setSavingId] = useState(null)
  const [pendingTitles, setPendingTitles] = useState({})

  // Clear the spinner once Redux reflects the new title
  useEffect(() => {
    if (!savingId || !pendingTitles[savingId]) return
    const geom = geometries.find(g => g.id === savingId)
    if (geom?.title === pendingTitles[savingId]) setSavingId(null)
  }, [geometries, savingId, pendingTitles])

  const startEdit = (e, geom) => {
    e.stopPropagation()
    setEditingId(geom.id)
    setEditValue(geomLabel(geom, geometries.indexOf(geom)))
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      setSavingId(editingId)
      setPendingTitles(prev => ({ ...prev, [editingId]: editValue.trim() }))
      onUpdateTitle(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Toolbar toggle button */}
      <Tooltip title={geometries.length ? `Geometries (${geometries.length})` : 'No geometries yet'} placement='right'>
        <Box component='span'>
          <IconButton
            disabled={!geometries.length}
            onClick={() => setInspectorOpen(p => !p)}
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              color: inspectorOpen && geometries.length ? 'primary.main' : 'text.secondary',
              bgcolor: inspectorOpen && geometries.length ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.selected', color: 'primary.main' },
              '&.Mui-disabled': { color: 'action.disabled' }
            }}
          >
            <CategoryIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Tooltip>

      {/* Panel — opens to the right of the toolbar */}
      {inspectorOpen && geometries.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            left: 'calc(100% + 8px)',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1100,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            boxShadow: 8,            
            minWidth: 200,
            maxWidth: 300
          }}
        >
          {/* Header — matches LayersPanel header style */}
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
            <Typography sx={{ flex: 1, fontSize: 11, ml: 0.75, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
              Geometries ({geometries.length})
            </Typography>
            <Tooltip title='Clear all'>
              <IconButton
                size='small'
                onClick={onDeleteAll}
                sx={{ p: 0.25, color: 'error.main', '&:hover': { bgcolor: 'action.selected' } }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            {/* <IconButton
              size='small'
              onClick={() => setListOpen(p => !p)}
              sx={{ p: 0.25, color: 'text.secondary', '&:hover': { bgcolor: 'action.selected' } }}
            >
              {listOpen ? <ExpandLessIcon sx={{ fontSize: 14 }} /> : <ExpandMoreIcon sx={{ fontSize: 14 }} />}
            </IconButton> */}
          </Box>

          {/* List */}
          {listOpen && (
          <Box sx={{ py: 0.5, maxHeight: 260, overflowY: 'auto' }}>
            {geometries.map((geom, i) => {
              const isVisible = geom.isVisible ?? true
              const isEditing = editingId === geom.id
              const GeomIcon = GEOM_ICON[geom.type] ?? GEOM_ICON.Point

              return (
                <Box
                  key={geom.id ?? i}
                  ref={el => {
                    inspectorRowRefs.current[i] = el
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.35,
                    borderLeft: '2px solid',
                    borderColor: isVisible ? 'primary.main' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  {/* Visibility toggle */}
                  <IconButton
                    size='small'
                    onClick={() => onToggleVisibility(geom.id)}
                    sx={{ p: 0.25, flexShrink: 0, color: isVisible ? 'primary.main' : 'text.disabled' }}
                  >
                    {isVisible ? <VisibilityIcon sx={{ fontSize: 13 }} /> : <VisibilityOffIcon sx={{ fontSize: 13 }} />}
                  </IconButton>

                  {/* Geometry type icon */}
                  <Box sx={{ color: isVisible ? 'text.secondary' : 'text.disabled', flexShrink: 0, display: 'flex' }}>
                    <GeomIcon sx={{ fontSize: 13 }} />
                  </Box>

                  {/* Label — inline input while editing, spinner while saving, plain text otherwise */}
                  {isEditing ? (
                    <Box
                      component='input'
                      ref={inputRef}
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
                        if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
                      }}
                      onClick={e => e.stopPropagation()}
                      sx={{
                        flex: 1,
                        fontSize: 11,
                        border: 'none',
                        borderBottom: '1px solid',
                        borderColor: 'primary.main',
                        outline: 'none',
                        background: 'transparent',
                        color: 'text.primary',
                        px: 0,
                        py: 0
                      }}
                    />
                  ) : savingId === geom.id ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                      <CircularProgress size={10} color='primary' />
                      <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: 11, color: 'text.secondary', fontStyle: 'italic' }}>
                        {pendingTitles[geom.id]}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      noWrap
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        fontSize: 11,
                        color: isVisible ? 'text.primary' : 'text.disabled',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {geomLabel(geom, i)}
                    </Typography>
                  )}

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 0, flexShrink: 0 }}>
                    <Tooltip title='Rename'>
                      <IconButton size='small' onClick={e => startEdit(e, geom)}
                        sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'action.selected' } }}>
                        <EditIcon sx={{ fontSize: 11 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Copy as ee.Geometry'>
                      <IconButton size='small' onClick={e => { e.stopPropagation(); onCopyGeometry(geom) }}
                        sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'action.selected' } }}>
                        <ContentCopyIcon sx={{ fontSize: 11 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Remove'>
                      <IconButton size='small' onClick={e => { e.stopPropagation(); onDeleteGeometry(geom.id, i) }}
                        sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'action.selected' } }}>
                        <CloseIcon sx={{ fontSize: 11 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
