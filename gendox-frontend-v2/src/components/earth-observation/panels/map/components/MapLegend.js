// GEE palettes are often hex without '#' ('3d9b46'); names ('red') pass as they are
const cssColor = color => (/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color) ? `#${color}` : color)

const formatValue = value => (typeof value === 'number' ? String(Number(value.toPrecision(3))) : String(value))

/**
 * What the colours of the top visible layer mean, bottom left on the map: the name the script gave it in
 * Map.addLayer, with its palette from min to max, or the colour of a drawn collection.
 * Layers without one (an RGB composite) show none.
 */
export default function MapLegend({ mapLayers, visibleLayers }) {
  const index = mapLayers.findLastIndex((layer, i) => visibleLayers.has(i))
  const layer = mapLayers[index]
  const legend = layer?.legend
  if (!legend) return null

  return (
    <div className='float eo-legend'>
      {legend.color ? (
        <div className='row' style={{ gap: 6 }}>
          <i className='swatch' style={{ background: cssColor(legend.color) }} />
          <span className='trunc'>{layer.name}</span>
        </div>
      ) : (
        <>
          <div className='trunc'>{layer.name}</div>
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
