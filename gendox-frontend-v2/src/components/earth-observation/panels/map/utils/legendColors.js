// GEE palettes are often hex without '#' ('3d9b46'); names ('red') pass as they are
export const cssColor = color => (/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color) ? `#${color}` : color)

export const formatValue = value => (typeof value === 'number' ? String(Number(value.toPrecision(3))) : String(value))

let colorContext = null

/** Any CSS colour ('red', '3d9b46', '#3d9b46') as [r, g, b], resolved by a canvas. */
export function toRgb(color) {
  colorContext ??= document.createElement('canvas').getContext('2d')
  colorContext.fillStyle = '#000'
  colorContext.fillStyle = cssColor(color)
  const hex = colorContext.fillStyle // always '#rrggbb' for an opaque colour

  return hex.startsWith('#') ? [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) : [0, 0, 0]
}

/**
 * The value a pixel colour stands for, read back off a palette spread evenly from min to max: the closest
 * point on the line through the palette's colours. An approximation, since tiles are 8-bit colours.
 */
export function valueFromPalette(rgb, legend) {
  if (typeof legend.min !== 'number' || typeof legend.max !== 'number') return null
  const colors = legend.palette.map(toRgb)
  if (colors.length < 2) return null // one colour says only that the layer covers the point

  let best = { distance: Infinity, t: 0 }
  for (let i = 0; i < colors.length - 1; i++) {
    const a = colors[i]
    const d = colors[i + 1].map((c, k) => c - a[k])
    const length = d.reduce((sum, c) => sum + c * c, 0)
    const along = length ? d.reduce((sum, c, k) => sum + c * (rgb[k] - a[k]), 0) / length : 0
    const t = Math.min(1, Math.max(0, along))
    const distance = a.reduce((sum, c, k) => sum + (c + t * d[k] - rgb[k]) ** 2, 0)
    if (distance < best.distance) best = { distance, t: (i + t) / (colors.length - 1) }
  }

  return legend.min + best.t * (legend.max - legend.min)
}
