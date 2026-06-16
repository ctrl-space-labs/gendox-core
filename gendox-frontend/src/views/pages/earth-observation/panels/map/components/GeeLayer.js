import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import dynamic from 'next/dynamic'

import { tileLayerLoaded } from 'src/store/earthObservation'

const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })

export default function GeeLayer({ url, opacity = 1 }) {
  const dispatch = useDispatch()

  const eventHandlers = useCallback(
    () => ({ load: () => dispatch(tileLayerLoaded()) }),
    [dispatch]
  )

  if (!url) return null

  return <TileLayer
      url={url} opacity={opacity} updateWhenIdle={true}
      updateWhenZooming={false}
      keepBuffer={0}
      eventHandlers={eventHandlers()}/>
}
