// src/views/pages/sea-scope/panels/editor/geeSuggestions.js

export const geeSuggestions = [
  // Globals
  { label: 'ee', insertText: 'ee', detail: 'Earth Engine global' },
  { label: 'Map', insertText: 'Map', detail: 'Earth Engine Map object' },
  {
    label: 'geometries',
    insertText: 'geometries[${1:index}]',
    detail:
      'Map-drawn EO geometries (Run Code): geometries[0], geometries["Title"], geometries.slug (slug = lowercased, alphanumeric only)'
  },

  // ee.*
  { label: 'ee.Image', insertText: "ee.Image('${1:ASSET_ID}')", detail: 'Create an Image' },
  { label: 'ee.ImageCollection', insertText: "ee.ImageCollection('${1:COLLECTION_ID}')", detail: 'Create an ImageCollection' },
  { label: 'ee.FeatureCollection', insertText: "ee.FeatureCollection('${1:COLLECTION_ID}')", detail: 'Create a FeatureCollection' },
  { label: 'ee.Geometry.Point', insertText: 'ee.Geometry.Point([${1:lng}, ${2:lat}])', detail: 'Point geometry' },

  // Map.*
  { label: 'Map.addLayer', insertText: "Map.addLayer(${1:image}, ${2:visParams}, '${3:name}')", detail: 'Add layer to map' },
  { label: 'Map.centerObject', insertText: 'Map.centerObject(${1:object}, ${2:zoom})', detail: 'Center map' },

  // Common ops
  { label: 'ee.Terrain.slope', insertText: 'ee.Terrain.slope(${1:image})', detail: 'Slope from DEM' },
  { label: 'filterDate', insertText: "filterDate('${1:YYYY-MM-DD}', '${2:YYYY-MM-DD}')", detail: 'ImageCollection filterDate' },
  { label: 'filterBounds', insertText: 'filterBounds(${1:geometry})', detail: 'ImageCollection filterBounds' }
]