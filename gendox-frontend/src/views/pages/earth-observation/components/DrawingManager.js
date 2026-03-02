import React, { useEffect, useRef } from 'react'
import { useMap, useMapEvents, CircleMarker, Polyline, Polygon, Marker } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '@mui/material/styles'

// Google Maps-style teardrop pin for Point markers.
const makePinIcon = color =>
  L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36"
              style="overflow:visible;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5));cursor:pointer">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 24 12 24s12-15.6 12-24C24 5.4 18.6 0 12 0z"
            fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.85"/>
    </svg>`,
    iconSize: [24, 36],
    iconAnchor: [12, 36]   // anchor at the pointed tip
  })

// Small circle divIcon used for vertex drag handles on LinearRing / Polygon.
const makeCircleIcon = (color, size = 10) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 0 4px rgba(0,0,0,.6);
      cursor:grab;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })

// Lives inside MapContainer — handles click events and renders geometries.
export default function DrawingManager({
  activeTool,
  pendingVertices,
  geometries,
  onMapClick,
  selectedIndex,
  onSelectGeometry,
  onUpdateGeometry
}) {
  const map = useMap()
  const theme = useTheme()

  const SELECTED_COLOR  = theme.palette.primary.light   // #0CD4A5
  const DEFAULT_COLOR   = theme.palette.primary.main    // #08B68D
  const PREVIEW_COLOR   = theme.palette.customColors.primaryGradient  // #16EAB8

  // Use refs so the stale-closure in useMapEvents always reads the latest values.
  const activeToolRef     = useRef(activeTool)
  const onMapClickRef     = useRef(onMapClick)
  const onSelectGeoRef    = useRef(onSelectGeometry)
  // Prevents the map's click (which fires in the same event chain as a layer click)
  // from immediately deselecting the geometry that was just selected.
  const geometryClickedRef = useRef(false)

  useEffect(() => {
    activeToolRef.current  = activeTool
    onMapClickRef.current  = onMapClick
    onSelectGeoRef.current = onSelectGeometry
  })

  // Crosshair cursor while a tool is active.
  useEffect(() => {
    map.getContainer().style.cursor = activeTool ? 'crosshair' : ''
  }, [activeTool, map])

  // Disable double-click zoom while drawing so it doesn't interfere.
  useEffect(() => {
    if (activeTool) {
      map.doubleClickZoom.disable()
    } else {
      map.doubleClickZoom.enable()
    }
    return () => map.doubleClickZoom.enable()
  }, [activeTool, map])

  useMapEvents({
    click(e) {
      // If a geometry layer was clicked in the same event cycle, skip map handler.
      if (geometryClickedRef.current) {
        geometryClickedRef.current = false
        return
      }
      if (activeToolRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng)
      } else {
        // Click on empty map → deselect
        onSelectGeoRef.current(null)
      }
    }
  })

  // Shared geometry click handler — marks the flag then selects/deselects.
  const makeGeomClickHandler = (i, isSelected) => e => {
    e.originalEvent?.stopPropagation()
    geometryClickedRef.current = true
    onSelectGeometry(isSelected ? null : i)
  }

  return (
    <>
      {/* ── Preview: dots for vertices being placed ── */}
      {pendingVertices.map((pos, i) => (
        <CircleMarker
          key={`pv-${i}`}
          center={pos}
          radius={4}
          pathOptions={{ color: PREVIEW_COLOR, fillColor: PREVIEW_COLOR, fillOpacity: 1 }}
        />
      ))}

      {/* ── Preview: dashed line connecting pending vertices ── */}
      {pendingVertices.length > 1 && (
        <Polyline
          positions={pendingVertices}
          pathOptions={{ color: PREVIEW_COLOR, weight: 2, dashArray: '6 4' }}
        />
      )}

      {/* ── Completed geometries ── */}
      {geometries.map((geom, i) => {
        const isSelected = selectedIndex === i
        const color      = isSelected ? SELECTED_COLOR : DEFAULT_COLOR
        const weight     = isSelected ? 3 : 2
        const clickHandler = makeGeomClickHandler(i, isSelected)

        // ── Point ──
        if (geom.type === 'Point') {
          const [lon, lat] = geom.coordinates
          return (
            <Marker
              key={`g${i}`}
              position={[lat, lon]}
              draggable={true}
              icon={makePinIcon(color)}
              eventHandlers={{
                click: clickHandler,
                dragend: e => {
                  const { lat: newLat, lng: newLng } = e.target.getLatLng()
                  onUpdateGeometry(i, { type: 'Point', coordinates: [newLng, newLat] })
                }
              }}
            />
          )
        }

        // ── LinearRing ──
        if (geom.type === 'LinearRing') {
          const positions = geom.coordinates.map(([lon, lat]) => [lat, lon])
          return (
            <React.Fragment key={`g${i}`}>
              {/* Wide invisible overlay — makes the thin line much easier to click */}
              <Polyline
                positions={positions}
                pathOptions={{ weight: 14, opacity: 0, interactive: true }}
                eventHandlers={{ click: clickHandler }}
              />
              {/* Visible line (non-interactive so it doesn't compete with the overlay) */}
              <Polyline
                positions={positions}
                pathOptions={{ color, weight, interactive: false }}
              />

              {/* Draggable vertex markers when selected */}
              {isSelected && geom.coordinates.map(([lon, lat], j) => (
                <Marker
                  key={`g${i}-v${j}`}
                  position={[lat, lon]}
                  draggable={true}
                  icon={makeCircleIcon(SELECTED_COLOR, 10)}
                  eventHandlers={{
                    click: e => { e.originalEvent?.stopPropagation(); geometryClickedRef.current = true },
                    dragend: e => {
                      const { lat: newLat, lng: newLng } = e.target.getLatLng()
                      const newCoords = [...geom.coordinates]
                      newCoords[j] = [newLng, newLat]
                      onUpdateGeometry(i, { type: 'LinearRing', coordinates: newCoords })
                    }
                  }}
                />
              ))}
            </React.Fragment>
          )
        }

        // ── Polygon ──
        if (geom.type === 'Polygon') {
          const ring      = geom.coordinates[0]
          const positions = ring.map(([lon, lat]) => [lat, lon])
          const vertices  = ring.slice(0, -1) // unique vertices (exclude closing duplicate)

          return (
            <React.Fragment key={`g${i}`}>
              <Polygon
                positions={positions}
                pathOptions={{ color, weight, fillOpacity: isSelected ? 0.35 : 0.2, interactive: true }}
                eventHandlers={{ click: clickHandler }}
              />

              {/* Draggable vertex markers when selected */}
              {isSelected && vertices.map(([lon, lat], j) => (
                <Marker
                  key={`g${i}-v${j}`}
                  position={[lat, lon]}
                  draggable={true}
                  icon={makeCircleIcon(SELECTED_COLOR, 10)}
                  eventHandlers={{
                    click: e => { e.originalEvent?.stopPropagation(); geometryClickedRef.current = true },
                    dragend: e => {
                      const { lat: newLat, lng: newLng } = e.target.getLatLng()
                      const newRing = [...ring]
                      newRing[j] = [newLng, newLat]
                      // Vertex 0 is also the closing vertex → keep ring closed
                      if (j === 0) newRing[newRing.length - 1] = [newLng, newLat]
                      onUpdateGeometry(i, { type: 'Polygon', coordinates: [newRing] })
                    }
                  }}
                />
              ))}
            </React.Fragment>
          )
        }

        return null
      })}
    </>
  )
}
