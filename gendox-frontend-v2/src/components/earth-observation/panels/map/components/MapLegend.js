const formatValue = value =>
  value === null || value === undefined ? '' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 })

/** The colour scale of the top visible layer drawn with a palette (Map.addLayer's min, max and palette), bottom left. */
export default function MapLegend({ mapLayers, visibleLayers }) {
  const layer = [...mapLayers.entries()].reverse().find(([i, l]) => visibleLayers.has(i) && l.legend)?.[1]
  if (!layer) return null
  const { min, max, palette } = layer.legend

  return (
    <div className='float eo-legend'>
      <span className='trunc'>{layer.name}</span>
      <i style={{ background: palette.length > 1 ? `linear-gradient(90deg, ${palette.join(', ')})` : palette[0] }} />
      {(min !== null || max !== null) && (
        <span className='row num' style={{ justifyContent: 'space-between' }}>
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </span>
      )}
    </div>
  )
}
