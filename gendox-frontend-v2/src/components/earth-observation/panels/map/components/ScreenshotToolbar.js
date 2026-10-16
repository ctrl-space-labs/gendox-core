import { Camera, LoaderCircle } from 'lucide-react'

// Copies a screenshot of the map window to the clipboard (html2canvas, see useMapScreenshot).
// The Earth Engine thumbnail export stays off, as in the old workspace: it doesn't work yet.
export default function ScreenshotToolbar({ isPanelCapturing, onPanelScreenshot }) {
  return (
    <button
      title={isPanelCapturing ? 'Copying…' : 'Copy a screenshot of the map'}
      onClick={onPanelScreenshot}
      disabled={isPanelCapturing}
    >
      {isPanelCapturing ? <LoaderCircle className='lucide turning' /> : <Camera className='lucide' />}
    </button>
  )
}
