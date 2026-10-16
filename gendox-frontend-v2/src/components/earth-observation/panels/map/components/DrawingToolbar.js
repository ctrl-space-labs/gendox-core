import { GEOM_ICON } from '../constants/geometryConstants'

const TOOLS = [
  ['point', 'Point', GEOM_ICON.Point],
  ['linearRing', 'Linear ring', GEOM_ICON.LinearRing],
  ['polygon', 'Polygon', GEOM_ICON.Polygon]
]

// The drawing tools, inside the map's left toolbar. Finishing a ring or polygon is the hint at the bottom of the map.
export default function DrawingToolbar({ activeTool, onSelectTool }) {
  return TOOLS.map(([tool, title, Icon]) => (
    <button key={tool} className={activeTool === tool ? 'on' : ''} title={title} onClick={() => onSelectTool(tool)}>
      <Icon className='lucide' />
    </button>
  ))
}

/** While drawing: what to do next, with Finish and Cancel */
export const DrawingHint = ({ activeTool, pendingVertices, canFinish, onFinish, onCancel }) => {
  if (!activeTool) return null
  const need = activeTool === 'point' ? 'one click' : activeTool === 'linearRing' ? 'need 2+' : 'need 3+'

  return (
    <div className='float eo-hint'>
      Click the map to add {activeTool === 'point' ? 'a point' : 'points'}
      <span className='faint'>
        · {activeTool === 'point' ? need : `${pendingVertices.length} so far, ${need}`}
      </span>
      {activeTool !== 'point' && (
        <button className='btn s primary' disabled={!canFinish} onClick={onFinish}>
          Finish
        </button>
      )}
      <button className='btn ghost s' onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}
