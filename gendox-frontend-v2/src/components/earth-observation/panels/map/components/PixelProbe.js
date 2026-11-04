import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMap } from 'react-leaflet'

import { formatValue, valueFromPalette } from '../utils/legendColors'

/**
 * The colour of a GEE layer's tile at a point, as [r, g, b, a], read from the tile already on screen, or
 * null when that tile is not loaded. GEE serves tiles with CORS and the layer asks for them with
 * crossOrigin, so the canvas stays readable. Leans on Leaflet's tile cache (_tiles, _tileZoom).
 */
function readPixel(tileLayer, latlng, context) {
  const zoom = tileLayer._tileZoom
  if (zoom == null) return null

  const size = tileLayer.getTileSize()
  const point = tileLayer._map.project(latlng, zoom)
  const x = Math.floor(point.x / size.x)
  const y = Math.floor(point.y / size.y)
  const image = tileLayer._tiles?.[`${x}:${y}:${zoom}`]?.el
  if (!image?.complete || !image.naturalWidth) return null

  const px = ((point.x - x * size.x) * image.naturalWidth) / size.x
  const py = ((point.y - y * size.y) * image.naturalHeight) / size.y
  try {
    context.clearRect(0, 0, 1, 1)
    context.drawImage(image, Math.floor(px), Math.floor(py), 1, 1, 0, 0, 1, 1)

    return context.getImageData(0, 0, 1, 1).data
  } catch {
    return null // a tile without CORS taints the canvas
  }
}

/**
 * A bubble beside the cursor with the approximate value of each visible layer under it, top layer first:
 * the tile's colour read back off the layer's palette (no request to GEE), or the layer's name where a
 * single-colour layer (a drawn collection) covers the point. Layers without a legend are left out.
 */
export default function PixelProbe({ mapLayers, visibleLayers }) {
  const map = useMap()
  const [probe, setProbe] = useState(null)
  const latest = useRef({ mapLayers, visibleLayers })
  latest.current = { mapLayers, visibleLayers }

  useEffect(() => {
    const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
    let frame = 0

    const read = event => {
      const { mapLayers, visibleLayers } = latest.current
      const tileLayers = {}
      map.eachLayer(layer => {
        if (layer._url && layer.getTileSize) tileLayers[layer._url] = layer
      })

      const rows = []
      for (let i = mapLayers.length - 1; i >= 0; i--) {
        const { url, name, legend } = mapLayers[i]
        if (!legend || !visibleLayers.has(i) || !tileLayers[url]) continue
        const pixel = readPixel(tileLayers[url], event.latlng, context)
        if (!pixel || pixel[3] === 0) continue
        const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
        const value = legend.color ? null : valueFromPalette([pixel[0], pixel[1], pixel[2]], legend)
        rows.push({ i, name, color, value: value == null ? null : `≈ ${formatValue(value)}` })
      }

      setProbe(rows.length ? { x: event.containerPoint.x, y: event.containerPoint.y, rows } : null)
    }

    const onMove = event => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => read(event))
    }

    const onLeave = () => {
      cancelAnimationFrame(frame)
      setProbe(null)
    }

    map.on('mousemove', onMove)
    map.on('mouseout zoomstart movestart', onLeave)

    return () => {
      cancelAnimationFrame(frame)
      map.off('mousemove', onMove)
      map.off('mouseout zoomstart movestart', onLeave)
    }
  }, [map])

  if (!probe) return null

  // keep the bubble inside the map: flip to the cursor's left / above it near the right / bottom edge
  const { x: width, y: height } = map.getSize()
  const style = {
    left: probe.x + 14,
    top: probe.y + 14,
    transform: `translate(${probe.x > width - 200 ? 'calc(-100% - 28px)' : '0'}, ${
      probe.y > height - 40 - probe.rows.length * 18 ? 'calc(-100% - 28px)' : '0'
    })`
  }

  return createPortal(
    <div className='eo-probe' style={style} data-html2canvas-ignore=''>
      {probe.rows.map(row => (
        <div key={row.i} className='row'>
          <i className='swatch' style={{ background: row.color }} />
          <span className='trunc'>{row.name}</span>
          {row.value && <b className='num'>{row.value}</b>}
        </div>
      ))}
    </div>,
    map.getContainer()
  )
}
