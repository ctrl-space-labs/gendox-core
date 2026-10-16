import { ChevronDown, ChevronUp, Layers } from 'lucide-react'

/** The script's map layers (Map.addLayer), each with a visibility box and an opacity slider. Folds to its header. */
export default function LayersPanel({
  mapLayers,
  visibleLayers,
  layerOpacities,
  layersOpen,
  setVisibleLayers,
  setLayerOpacities,
  setLayersOpen
}) {
  if (!mapLayers.length) return null

  return (
    <div className='float'>
      <button className='h' onClick={() => setLayersOpen(o => !o)}>
        <Layers className='lucide' />
        Layers <span className='faint num'>{mapLayers.length}</span>
        {layersOpen ? <ChevronUp className='lucide' /> : <ChevronDown className='lucide' />}
      </button>
      {layersOpen && (
        <div className='b'>
          {mapLayers.map((layer, i) => {
            const isVisible = visibleLayers.has(i)

            return (
              <div key={i} className='eo-row'>
                <input
                  type='checkbox'
                  checked={isVisible}
                  aria-label={`Show ${layer.name}`}
                  style={{ accentColor: 'var(--accent)' }}
                  onChange={() =>
                    setVisibleLayers(prev => {
                      const next = new Set(prev)
                      isVisible ? next.delete(i) : next.add(i)

                      return next
                    })
                  }
                />
                <span className='trunc' style={{ flex: 1, color: isVisible ? undefined : 'var(--text-3)' }} title={layer.name}>
                  {layer.name}
                </span>
                <input
                  type='range'
                  min={0}
                  max={1}
                  step={0.05}
                  title='Opacity'
                  value={layerOpacities[i] ?? 1}
                  disabled={!isVisible}
                  onChange={e =>
                    setLayerOpacities(prev => {
                      const next = [...prev]
                      next[i] = parseFloat(e.target.value)

                      return next
                    })
                  }
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
