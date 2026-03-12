import dynamic from 'next/dynamic'

const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })

export default function GeeLayer({ url, opacity = 1 }) {
  if (!url) return null
  return <TileLayer url={url} opacity={opacity} />
}
