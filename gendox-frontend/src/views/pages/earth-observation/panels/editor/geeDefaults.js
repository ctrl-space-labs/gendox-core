export const DEFAULT_GEE_CODE = `// Google Earth Engine (JavaScript) - demo
var srtm = ee.Image('CGIAR/SRTM90_V4');
var slope = ee.Terrain.slope(srtm);

Map.centerObject(ee.Geometry.Point([-112.8598, 36.2841]), 9);
Map.addLayer(slope, {min: 0, max: 60}, 'Slope');
`