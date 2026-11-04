import { useState } from 'react'
import { ChevronDown, ChevronUp, Palette } from 'lucide-react'

import { cssColor, formatValue } from '../utils/legendColors'

function LegendSection({ layer }) {
  const { legend } = layer

  return (
    <div className='eo-legend'>
      {legend.color ? (
        <div className='row' style={{ gap: 6 }}>
          <i className='swatch' style={{ background: cssColor(legend.color) }} />
          <span className='trunc' title={layer.name}>
            {layer.name}
          </span>
        </div>
      ) : (
        <>
          <div className='trunc' title={layer.name}>
            {layer.name}
          </div>
          <i
            className='scale'
            style={{ background: `linear-gradient(90deg, ${legend.palette.map(cssColor).join(', ')})` }}
          />
          <div className='row num' style={{ justifyContent: 'space-between' }}>
            <span>{formatValue(legend.min)}</span>
            <span>{formatValue(legend.max)}</span>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * What the colours of the visible layers mean, bottom left on the map: one section per layer, named as the
 * script named it in Map.addLayer, with its palette from min to max, or the colour of a drawn collection.
 * Sections list the top layer first, in one card whose header folds them away.
 * Layers without a legend (an RGB composite) show none.
 */
export default function MapLegend({ mapLayers, visibleLayers }) {
  // a phone-sized screen starts folded, so the legend does not cover the map
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 600)

  const layers = mapLayers
    .map((layer, i) => ({ layer, i }))
    .filter(({ layer, i }) => layer.legend && visibleLayers.has(i))
    .reverse()
  if (layers.length === 0) return null

  return (
    <div className='float eo-legends'>
      <button
        className='h'
        onClick={() => setOpen(o => !o)}
        title={open ? 'Minimize legend' : 'Show legend'}
        aria-expanded={open}
      >
        <Palette className='lucide' />
        Legend <span className='faint num'>{layers.length}</span>
        {open ? <ChevronDown className='lucide' /> : <ChevronUp className='lucide' />}
      </button>
      {open && (
        <div className='b'>
          {layers.map(({ layer, i }) => (
            <LegendSection key={i} layer={layer} />
          ))}
        </div>
      )}
    </div>
  )
}
