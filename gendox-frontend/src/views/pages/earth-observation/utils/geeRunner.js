import ee from '@google/earthengine'

export const executeGeeCode = async (codeString) => {
  return new Promise((resolve, reject) => {
    try {
      
      let result = {
        url: null,
        center: null
      }
      let foundLayer = false

      // --- THE MOCK MAP OBJECT ---
      const MockMap = {
        // 1. addLayer: The most basic
        addLayer: (image, visParams = {}, name) => {
          console.log(`[GEE Mock] Adding layer: ${name}`)
          foundLayer = true
          
          // If it's Geometry/Feature, convert to Image to be visible
          if (image instanceof ee.Geometry || image instanceof ee.Feature || image instanceof ee.FeatureCollection) {
             // If no color given, use red
             const color = visParams.color || 'red'
             // Feature -> Image transformation (paint)
             image = ee.Image().paint(image, 2).visualize({palette: [color]})
             // visualize returns an RGB image, so visParams are no longer needed there
             visParams = {} 
          }

          // HERE IT COMMUNICATES WITH GEE TO GET URL
          image.getMapId(visParams, (response, error) => {
            if (error) {
              console.error('[GEE API Error]', error)
              // We don't reject immediately, there might be another layer working
              // But for the demo, let's reject if the main one fails
              reject(new Error(error.message))
            } else {
              result.url = response.urlFormat
              if (result.url) resolve(result)
            }
          })
        },

        // 2. setCenter: Manually set coordinates
        setCenter: (lon, lat, zoom) => {
           console.log(`[GEE Mock] Setting center: ${lon}, ${lat}, ${zoom}`)
           result.center = { lon, lat, zoom }
        },

        // 3. centerObject: The fix for your error
        centerObject: (object, zoom) => {
           console.log('[GEE Mock] centerObject called.')
           // NOTE: In the client-side mock, it's difficult to calculate 
           // the center of a geometry asynchronously before returning the promise.
           // So we just log it to avoid crashing.
           // If you want to center, use Map.setCenter() for now.
        },

        // 4. Other stubs to prevent code from crashing
        setOptions: () => {},
        add: () => {},
        getScale: () => 1000,
        getZoom: () => 6,
        drawingTools: () => ({ setShown: () => {}, layers: () => ({}) })
      }

      // --- CODE EXECUTION ---
      const userFunc = new Function('ee', 'Map', codeString)
      userFunc(ee, MockMap)

      // if no layers were added, but center was set
      // (Useful if someone just wants to move the map)
      if (!foundLayer) {
        if (result.center) {
            resolve(result)
        } else {
            // If a few msec have passed and we have no result, it might be async
            // But here we assume synchronous call of addLayer.
            // We leave a little time in case getMapId is running
            setTimeout(() => {
                if (!result.url) reject(new Error('No Map.addLayer() found or executed.'))
            }, 1000)
        }
      }

    } catch (err) {
      reject(err)
    }
  })
}