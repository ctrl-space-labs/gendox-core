import { useState, useRef, useEffect } from 'react'
import { Copy, Eye, EyeOff, LoaderCircle, Pencil, Shapes, Trash2, X } from 'lucide-react'

import { geomLabel } from '../utils/geometryHelpers'
import { GEOM_ICON } from '../constants/geometryConstants'

/** The toolbar button that opens the shapes panel, with how many there are */
export const GeometryButton = ({ geometries, inspectorOpen, setInspectorOpen }) => (
  <button
    className={inspectorOpen ? 'on' : ''}
    title={geometries.length ? `Shapes (${geometries.length})` : 'Shapes'}
    onClick={() => setInspectorOpen(p => !p)}
  >
    <Shapes className='lucide' />
    {geometries.length > 0 && <span className='n'>{geometries.length}</span>}
  </button>
)

/**
 * The shapes drawn on the map, beside the toolbar: show or hide, rename, copy as ee.Geometry, remove.
 * Scripts use them as geometries['name'] or geometries[i].
 */
export default function GeometryInspector({
  geometries,
  inspectorOpen,
  setInspectorOpen,
  inspectorRowRefs,
  selectedGeometryIndex,
  onToggleVisibility,
  onUpdateTitle,
  onCopyGeometry,
  onDeleteGeometry,
  onDeleteAll
}) {
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

  if (!inspectorOpen) return null

  return (
    <div className='float eo-panel'>
      <div className='h'>
        Shapes<span className='faint num'>{geometries.length}</span>
        <span className='sp' />
        <button className='btn ghost s' onClick={onDeleteAll} disabled={!geometries.length}>
          Clear all
        </button>
        <button className='btn ghost s icon' title='Close' onClick={() => setInspectorOpen(false)}>
          <X className='lucide' />
        </button>
      </div>
      <div className='b'>
        {geometries.length === 0 ? (
          <p className='faint sm' style={{ padding: 10 }}>
            Draw a point, a ring or a polygon with the tools on the left. Your script can use them as{' '}
            <code>geometries</code>.
          </p>
        ) : (
          geometries.map((geom, i) => {
            const isVisible = geom.isVisible ?? true
            const GeomIcon = GEOM_ICON[geom.type] ?? GEOM_ICON.Point

            return (
              <div
                key={geom.id ?? i}
                ref={el => {
                  inspectorRowRefs.current[i] = el
                }}
                className={`eo-row ${selectedGeometryIndex === i ? 'sel' : ''}`}
              >
                <GeomIcon className='lucide' style={{ width: 15, color: isVisible ? 'var(--text-2)' : 'var(--text-3)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === geom.id ? (
                    <input
                      ref={inputRef}
                      className='input s'
                      value={editValue}
                      aria-label='Shape name'
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          commitEdit()
                        }
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          setEditingId(null)
                        }
                      }}
                    />
                  ) : savingId === geom.id ? (
                    <div className='row faint' style={{ gap: 6 }}>
                      <LoaderCircle className='lucide turning' style={{ width: 12 }} />
                      <span className='trunc'>{pendingTitles[geom.id]}</span>
                    </div>
                  ) : (
                    <>
                      <div className='trunc' style={{ color: isVisible ? undefined : 'var(--text-3)' }}>
                        {geomLabel(geom, i)}
                      </div>
                      <div className='faint sm'>{geom.type}</div>
                    </>
                  )}
                </div>
                <button
                  className='btn ghost s icon'
                  title={isVisible ? 'Hide' : 'Show'}
                  onClick={() => onToggleVisibility(geom.id)}
                >
                  {isVisible ? <Eye className='lucide' /> : <EyeOff className='lucide' />}
                </button>
                <button className='btn ghost s icon' title='Rename' onClick={e => startEdit(e, geom)}>
                  <Pencil className='lucide' />
                </button>
                <button
                  className='btn ghost s icon'
                  title='Copy as ee.Geometry'
                  onClick={e => {
                    e.stopPropagation()
                    onCopyGeometry(geom)
                  }}
                >
                  <Copy className='lucide' />
                </button>
                <button
                  className='btn ghost s icon'
                  title='Remove'
                  onClick={e => {
                    e.stopPropagation()
                    onDeleteGeometry(geom.id, i)
                  }}
                >
                  <Trash2 className='lucide' />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
